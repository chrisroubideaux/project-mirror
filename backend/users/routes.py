# backend/users/routes.py
from uuid import uuid4
from datetime import datetime
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from . import user_bp
from .models import User, EmotionalProfile, FaceEmbedding, db
from utils.decorators import token_required
from utils.jwt_token import generate_jwt_token
from gcs_client import upload_file_to_gcs 


# ---------------------------------------------------------
# Helper: Normalize user
# ---------------------------------------------------------
def _normalize_user(u: User) -> dict:
    return u.to_public_dict()

@user_bp.route("/test-create-full", methods=["POST"])
def test_create_full_user():
    """
    Developer-only route.
    Create a complete Aurora User + EmotionalProfile with all possible fields.
    No password required. No OAuth required.
    Returns JWT for easy testing of protected routes.
    """

    data = request.get_json() or {}

    email = data.get("email")
    full_name = data.get("full_name")

    if not email or not full_name:
        return jsonify({"error": "email and full_name are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 400

    # ----------------------------
    # Create User
    # ----------------------------
    user = User(
        id=uuid4(),
        email=email,
        full_name=full_name,

        profile_image_url=data.get("profile_image_url"),
        oauth_provider=data.get("oauth_provider"),
        oauth_id=data.get("oauth_id"),

        is_anonymous_user=data.get("is_anonymous_user", False),
        allow_emotion_logging=data.get("allow_emotion_logging", True),
        allow_face_storage=data.get("allow_face_storage", True),

        relationship_stage=data.get("relationship_stage", "new"),
        preferred_tone=data.get("preferred_tone", "gentle"),
        comfort_level_score=data.get("comfort_level_score", 0.0),
        openness_level_score=data.get("openness_level_score", 0.0),

        created_at=datetime.utcnow(),
    )

    # ----------------------------
    # Emotional Profile
    # ----------------------------
    profile = EmotionalProfile(
        user=user,

        baseline_emotion_vector=data.get("baseline_emotion_vector"),
        common_microexpressions=data.get("common_microexpressions"),
        average_gaze_pattern=data.get("average_gaze_pattern"),

        stress_indicator_level=data.get("stress_indicator_level", 0.0),
        mood_variability_score=data.get("mood_variability_score", 0.0),
        daily_mood_streak=data.get("daily_mood_streak", 0),

        last_emotional_shift_at=data.get("last_emotional_shift_at"),
        crisis_count=data.get("crisis_count", 0),
        last_crisis_flag_at=data.get("last_crisis_flag_at"),
    )

    db.session.add(user)
    db.session.add(profile)
    db.session.commit()

    # Generate JWT
    token = generate_jwt_token(str(user.id), user.email)

    return jsonify({
        "message": "Dev AURORA user created successfully",
        "token": token,
        "user": _normalize_user(user)
    }), 201





# ---------------------------------------------------------
# GET /api/users/me — Current authenticated user
# ---------------------------------------------------------
@user_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user: User):
    return jsonify(_normalize_user(current_user)), 200


# ---------------------------------------------------------
# GET /api/users — List all users (future admin only)
# ---------------------------------------------------------
@user_bp.route("/", methods=["GET"])
@token_required
def list_users(current_user: User):
    users = User.query.all()
    return jsonify([_normalize_user(u) for u in users]), 200


# ---------------------------------------------------------
# GET /api/users/<id> — Fetch a single user
# ---------------------------------------------------------
@user_bp.route("/<string:user_id>", methods=["GET"])
@token_required
def get_user(current_user: User, user_id: str):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Optional: only self-access for now
    if str(current_user.id) != user_id:
        return jsonify({"error": "Forbidden"}), 403

    return jsonify(_normalize_user(user)), 200


# ---------------------------------------------------------
# PUT /api/users/<id> — Update user settings + emotional profile
# ---------------------------------------------------------
@user_bp.route("/<string:user_id>", methods=["PUT"])
@token_required
def update_user(current_user: User, user_id: str):
    if str(current_user.id) != user_id:
        return jsonify({"error": "Forbidden"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}

    user_fields = [
        "full_name",
        "profile_image_url",
        "oauth_provider",
        "is_anonymous_user",
        "allow_emotion_logging",
        "allow_face_storage",
        "relationship_stage",
        "preferred_tone",
        "comfort_level_score",
        "openness_level_score",
    ]

    for field in user_fields:
        if field in data:
            setattr(user, field, data[field])

    user.updated_at = datetime.utcnow()

    # Emotional Profile
    profile = user.emotional_profile
    if profile:
        profile_fields = [
            "baseline_emotion_vector",
            "common_microexpressions",
            "average_gaze_pattern",
            "stress_indicator_level",
            "mood_variability_score",
            "daily_mood_streak",
            "last_emotional_shift_at",
            "crisis_count",
            "last_crisis_flag_at",
        ]

        for field in profile_fields:
            if field in data:
                setattr(profile, field, data[field])

        profile.updated_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "message": "User updated successfully",
        "user": _normalize_user(user)
    }), 200


# ---------------------------------------------------------
# DELETE /api/users/<id> — Delete user + emotional profile
# ---------------------------------------------------------
@user_bp.route("/<string:user_id>", methods=["DELETE"])
@token_required
def delete_user(current_user: User, user_id: str):
    if str(current_user.id) != user_id:
        return jsonify({"error": "Forbidden"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted"}), 200


# ---------------------------------------------------------
# POST /api/users/upload-profile — Upload profile image
# ---------------------------------------------------------
@user_bp.route("/upload-profile", methods=["POST"])
@token_required
def upload_profile_image(current_user):
    try:
        if "image" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        image = request.files["image"]
        filename = f"profiles/{uuid4()}.jpg"

        url = upload_file_to_gcs(image, filename)
        current_user.profile_image_url = url
        db.session.commit()

        return jsonify({"message": "Image uploaded", "url": url}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------
# POST /api/users/dev-token — Development-only JWT
# ---------------------------------------------------------
@user_bp.route("/dev-token", methods=["POST"])
def dev_token():
    """
    Issue a fake JWT for local testing without OAuth.
    """
    data = request.get_json() or {}

    fake_id = data.get("id") or str(uuid4())
    fake_email = data.get("email") or "dev@example.com"

    token = generate_jwt_token(fake_id, fake_email)

    return jsonify({
        "token": token,
        "id": fake_id,
        "email": fake_email
    }), 200




"""""""""""""""
from uuid import uuid4
from datetime import datetime

from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from . import user_bp
from .models import User, EmotionalProfile, db
from utils.jwt_token import generate_jwt_token
from utils.decorators import token_required


# -------------------------
# Helpers
# -------------------------
def _normalize_user(u: User) -> dict:
    return u.to_public_dict()



@user_bp.route("/test-create", methods=["POST"])
def test_create_user_full():
    
    data = request.get_json() or {}

    # Required
    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")

    if not email or not password or not full_name:
        return jsonify({"error": "email, password, and full_name are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = generate_password_hash(password)

    # -----------------------------
    # Create User (AURORA fields only)
    # -----------------------------
    user = User(
        id=uuid4(),
        email=email,
        full_name=full_name,
        password_hash=hashed_password,

        # Optional identity + relationship
        profile_image_url=data.get("profile_image_url"),
        oauth_provider=data.get("oauth_provider"),
        oauth_id=data.get("oauth_id"),

        is_anonymous_user=data.get("is_anonymous_user", False),
        allow_emotion_logging=data.get("allow_emotion_logging", True),
        allow_face_storage=data.get("allow_face_storage", True),

        relationship_stage=data.get("relationship_stage", "new"),
        preferred_tone=data.get("preferred_tone", "gentle"),
        comfort_level_score=data.get("comfort_level_score", 0.0),
        openness_level_score=data.get("openness_level_score", 0.0),

        created_at=datetime.utcnow(),
    )

    # -----------------------------
    # Create Emotional Profile
    # -----------------------------
    profile = EmotionalProfile(
        user=user,
        baseline_emotion_vector=data.get("baseline_emotion_vector"),
        common_microexpressions=data.get("common_microexpressions"),
        average_gaze_pattern=data.get("average_gaze_pattern"),

        stress_indicator_level=data.get("stress_indicator_level", 0.0),
        mood_variability_score=data.get("mood_variability_score", 0.0),
        daily_mood_streak=data.get("daily_mood_streak", 0),

        last_emotional_shift_at=data.get("last_emotional_shift_at"),
        crisis_count=data.get("crisis_count", 0),
        last_crisis_flag_at=data.get("last_crisis_flag_at"),
    )

    db.session.add(user)
    db.session.add(profile)
    db.session.commit()

    return jsonify({
        "message": "AURORA dev test user created successfully",
        "user": _normalize_user(user)
    }), 201

@user_bp.route("/test-list", methods=["GET"])
def test_list_users():
   
    users = User.query.all()
    return jsonify([u.to_public_dict() for u in users]), 200

@user_bp.route("/test-reset", methods=["DELETE"])
def test_reset_all_users():
   
    try:
        num_embeddings = FaceEmbedding.query.delete()
        num_profiles = EmotionalProfile.query.delete()
        num_users = User.query.delete()
        db.session.commit()

        return jsonify({
            "message": "All user-related data has been wiped.",
            "users_deleted": num_users,
            "profiles_deleted": num_profiles,
            "embeddings_deleted": num_embeddings
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
@user_bp.route("/<string:user_id>", methods=["DELETE"])
def delete_user_by_id(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": f"User {user_id} deleted successfully"}), 200

    
    
@user_bp.route("/test-update/<string:user_id>", methods=["PUT"])
def test_update_user(user_id):
   
    data = request.get_json() or {}
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Update User fields
    for field, value in data.items():
        if hasattr(User, field):
            setattr(user, field, value)

    # Update EmotionalProfile fields
    profile = user.emotional_profile
    if profile:
        for field, value in data.items():
            if hasattr(EmotionalProfile, field):
                setattr(profile, field, value)

    db.session.commit()

    return jsonify({
        "message": "User updated successfully",
        "user": user.to_public_dict()
    }), 200




# -------------------------
# REGISTER (basic dev flow)
# -------------------------
@user_bp.route("/register", methods=["POST"])
def register_user():
   
    data = request.get_json() or {}

    email = data.get("email")
    password = data.get("password")
    full_name = data.get("full_name")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = generate_password_hash(password)

    user = User(
        id=uuid4(),
        email=email,
        full_name=full_name,
        password_hash=hashed_password,
        created_at=datetime.utcnow(),
    )

    # Create initial emotional profile
    profile = EmotionalProfile(
        user=user,
        baseline_emotion_vector=None,
        common_microexpressions=None,
        average_gaze_pattern=None,
    )

    db.session.add(user)
    db.session.add(profile)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully",
        "user": _normalize_user(user)
    }), 201


# -------------------------
# LOGIN (dev / fallback)
# -------------------------
@user_bp.route("/login", methods=["POST"])
def login_user():
   
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    user.last_login_at = datetime.utcnow()
    db.session.commit()

    token = generate_jwt_token(str(user.id), user.email)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": _normalize_user(user)
    }), 200


# -------------------------
# GET current user (/me)
# -------------------------
@user_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user: User):
    
    return jsonify(_normalize_user(current_user)), 200
    
"""""""""""""""