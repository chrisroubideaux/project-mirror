# backend/admin/routes.py

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from uuid import uuid4
from flask_jwt_extended import create_access_token
from extensions import db
from .models import Admin
from users.models import User
from .decorators import admin_token_required
# from admin.analytics.aurora_analytics import compute_aurora_overview

from admin.analytics.aurora_analytics import compute_user_aurora_snapshot, compute_aurora_overview

admin_bp = Blueprint("admins", __name__, url_prefix="/api/admins")


# -------------------------
# REGISTER a new admin (OPEN)
# -------------------------
@admin_bp.route("/register", methods=["POST"])
def register_admin():
    data = request.get_json() or {}
    required = ["email", "password", "full_name"]

    for f in required:
        if f not in data:
            return jsonify({"error": f"Missing field: {f}"}), 400

    if Admin.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already registered"}), 400

    # NOTE: Your Admin model in the snippet you pasted earlier is minimal.
    # This route includes extra fields (bio, address, etc.). That's fine ONLY if
    # those columns exist in the Admin model/table. If they don't, SQLAlchemy will error.
    admin = Admin(
        id=str(uuid4()),
        full_name=data["full_name"],
        email=data["email"],
        password_hash=generate_password_hash(data["password"]),
        bio=data.get("bio"),
        address=data.get("address"),
        phone_number=data.get("phone"),
        profile_image_url=data.get("profile_image"),
        profile_banner_url=data.get("profile_banner_url"),
        age=data.get("age"),
        weight=data.get("weight"),
        height=data.get("height"),
        gender=data.get("gender"),
        fitness_goal=data.get("fitness_goal"),
        activity_level=data.get("activity_level"),
        experience_level=data.get("experience_level"),
        experience_years=data.get("experience_years"),
        certifications=data.get("certifications"),
        specialties=data.get("specialties"),
        medical_conditions=data.get("medical_conditions"),
        role=data.get("role", "trainer_admin"),
        membership_plan_id=data.get("membership_plan_id"),
    )

    db.session.add(admin)
    db.session.commit()

    return jsonify({"message": "Admin registered successfully", "admin_id": str(admin.id)}), 201


# -------------------------
# LOGIN admin  ✅ NOW ISSUES flask_jwt_extended TOKEN
# -------------------------
@admin_bp.route("/login", methods=["POST"])
def login_admin():
    data = request.get_json() or {}
    admin = Admin.query.filter_by(email=data.get("email")).first()

    if not admin or not check_password_hash(admin.password_hash, data.get("password") or ""):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(
        identity=str(admin.id),
        additional_claims={"role": "admin"}
    )

    return jsonify({
        "message": "Login successful",
        "admin_id": str(admin.id),
        "token": token
    }), 200


# -------------------------
# GET all admins
# -------------------------
@admin_bp.route("/", methods=["GET"])
@admin_token_required
def get_all_admins(current_admin):
    admins = Admin.query.all()
    return jsonify([{
        "admin_id": str(a.id),
        "full_name": a.full_name,
        "email": a.email,
        "bio": getattr(a, "bio", None),
        "address": getattr(a, "address", None),
        "phone_number": getattr(a, "phone_number", None),
        "profile_image_url": getattr(a, "profile_image_url", None),
        "profile_banner_url": getattr(a, "profile_banner_url", None),
        "role": getattr(a, "role", None),
        "experience_level": getattr(a, "experience_level", None),
        "experience_years": getattr(a, "experience_years", None),
        "certifications": getattr(a, "certifications", None),
        "specialties": getattr(a, "specialties", None),
        "membership_plan_id": str(getattr(a, "membership_plan_id", None)) if getattr(a, "membership_plan_id", None) else None,
    } for a in admins]), 200


# -------------------------
# GET all admins (public - guest access)
# -------------------------
@admin_bp.route("/public", methods=["GET"])
def get_all_admins_public():
    admins = Admin.query.all()
    return jsonify([{
        "admin_id": str(a.id),
        "full_name": a.full_name,
        "bio": getattr(a, "bio", None),
        "profile_image_url": getattr(a, "profile_image_url", None),
        "profile_banner_url": getattr(a, "profile_banner_url", None),
        "role": getattr(a, "role", None),
        "experience_level": getattr(a, "experience_level", None),
        "experience_years": getattr(a, "experience_years", None),
        "specialties": getattr(a, "specialties", None),
    } for a in admins]), 200


# -------------------------
# GET single admin (public)
# -------------------------
@admin_bp.route("/public/<string:admin_id>", methods=["GET"])
def get_admin_public(admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    return jsonify({
        "admin_id": str(admin.id),
        "full_name": admin.full_name,
        "bio": getattr(admin, "bio", None),
        "address": getattr(admin, "address", None),
        "phone_number": getattr(admin, "phone_number", None),
        "profile_image_url": getattr(admin, "profile_image_url", None),
        "profile_banner_url": getattr(admin, "profile_banner_url", None),
        "role": getattr(admin, "role", None),
        "experience_level": getattr(admin, "experience_level", None),
        "experience_years": getattr(admin, "experience_years", None),
        "certifications": getattr(admin, "certifications", None),
        "specialties": getattr(admin, "specialties", None),
        "email": admin.email,
    }), 200


# -------------------------
# GET single admin by ID
# -------------------------
@admin_bp.route("/<string:admin_id>", methods=["GET"])
@admin_token_required
def get_admin(current_admin, admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    return jsonify({
        "admin_id": str(admin.id),
        "full_name": admin.full_name,
        "email": admin.email,
        "bio": getattr(admin, "bio", None),
        "address": getattr(admin, "address", None),
        "phone_number": getattr(admin, "phone_number", None),
        "profile_image_url": getattr(admin, "profile_image_url", None),
        "profile_banner_url": getattr(admin, "profile_banner_url", None),
        "role": getattr(admin, "role", None),
        "experience_level": getattr(admin, "experience_level", None),
        "experience_years": getattr(admin, "experience_years", None),
        "certifications": getattr(admin, "certifications", None),
        "specialties": getattr(admin, "specialties", None),
        "membership_plan_id": str(getattr(admin, "membership_plan_id", None)) if getattr(admin, "membership_plan_id", None) else None,
    }), 200


# -------------------------
# UPDATE admin
# -------------------------
@admin_bp.route("/<string:admin_id>", methods=["PUT"])
@admin_token_required
def update_admin(current_admin, admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    if str(current_admin.id) != admin_id:
        return jsonify({"error": "Forbidden - you can only update your own profile"}), 403

    data = request.get_json() or {}

    admin.full_name = data.get("full_name", admin.full_name)
    admin.bio = data.get("bio", getattr(admin, "bio", None))
    admin.address = data.get("address", getattr(admin, "address", None))
    admin.phone_number = data.get("phone", getattr(admin, "phone_number", None))
    admin.profile_image_url = data.get("profile_image", getattr(admin, "profile_image_url", None))
    admin.profile_banner_url = data.get("profile_banner_url", getattr(admin, "profile_banner_url", None))
    admin.age = data.get("age", getattr(admin, "age", None))
    admin.weight = data.get("weight", getattr(admin, "weight", None))
    admin.height = data.get("height", getattr(admin, "height", None))
    admin.gender = data.get("gender", getattr(admin, "gender", None))
    admin.fitness_goal = data.get("fitness_goal", getattr(admin, "fitness_goal", None))
    admin.activity_level = data.get("activity_level", getattr(admin, "activity_level", None))
    admin.experience_level = data.get("experience_level", getattr(admin, "experience_level", None))
    admin.experience_years = data.get("experience_years", getattr(admin, "experience_years", None))
    admin.certifications = data.get("certifications", getattr(admin, "certifications", None))
    admin.specialties = data.get("specialties", getattr(admin, "specialties", None))
    admin.medical_conditions = data.get("medical_conditions", getattr(admin, "medical_conditions", None))
    admin.role = data.get("role", getattr(admin, "role", "admin"))
    admin.membership_plan_id = data.get("membership_plan_id", getattr(admin, "membership_plan_id", None))

    db.session.commit()
    return jsonify({"message": "Admin updated successfully"}), 200


# -------------------------
# DELETE admin
# -------------------------
@admin_bp.route("/<string:admin_id>", methods=["DELETE"])
@admin_token_required
def delete_admin(current_admin, admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    db.session.delete(admin)
    db.session.commit()
    return jsonify({"message": f"Admin '{admin.full_name}' deleted"}), 200


# -------------------------
# GET current admin profile
# -------------------------
@admin_bp.route("/me", methods=["GET"])
@admin_token_required
def get_admin_profile(current_admin):
    return jsonify({
        "id": str(current_admin.id),
        "email": current_admin.email,
        "full_name": current_admin.full_name,
        "profile_image_url": getattr(current_admin, "profile_image_url", None),
        "profile_banner_url": getattr(current_admin, "profile_banner_url", None),
        "bio": getattr(current_admin, "bio", None),
        "address": getattr(current_admin, "address", None),
        "phone": getattr(current_admin, "phone_number", None),
        "role": getattr(current_admin, "role", None),
        "experience_level": getattr(current_admin, "experience_level", None),
        "experience_years": getattr(current_admin, "experience_years", None),
        "certifications": getattr(current_admin, "certifications", None),
        "specialties": getattr(current_admin, "specialties", None),
        "membership_plan_id": str(getattr(current_admin, "membership_plan_id", None)) if getattr(current_admin, "membership_plan_id", None) else None,
    }), 200


# -------------------------
# GET all users (open for admins)
# -------------------------
@admin_bp.route("/users", methods=["GET"])
@admin_token_required
def get_all_users_as_admin(current_admin):
    limit = request.args.get("limit", type=int)
    q = User.query
    if limit:
        q = q.limit(limit)

    users = q.all()
    return jsonify([{
        "id": str(u.id),
        "full_name": getattr(u, "full_name", None),
        "email": u.email,
        "bio": getattr(u, "bio", None),
        "address": getattr(u, "address", None),
        "phone_number": getattr(u, "phone_number", None),
        "profile_image_url": getattr(u, "profile_image_url", None),
        "membership_plan_id": str(getattr(u, "membership_plan_id", None)) if getattr(u, "membership_plan_id", None) else None,
        "plan_name": u.membership_plan.name if getattr(u, "membership_plan", None) else "Free",
        "plan_price": u.membership_plan.price if getattr(u, "membership_plan", None) else 0.0,
        "plan_features": u.membership_plan.features if getattr(u, "membership_plan", None) else []
    } for u in users]), 200


# -------------------------
# DELETE any user (open for admins)
# -------------------------
@admin_bp.route("/delete_user/<string:user_id>", methods=["DELETE"])
@admin_token_required
def delete_any_user(current_admin, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": f"Admin '{current_admin.full_name}' deleted user '{getattr(user, 'full_name', user.email)}'"}), 200


# -------------------------
# AURORA ANALYTICS OVERVIEW
# -------------------------
@admin_bp.route("/analytics/aurora/overview", methods=["GET"])
@admin_token_required
def aurora_overview(current_admin):

    data = compute_aurora_overview()

    return jsonify({
        "analytics": data
    }), 200



# -------------------------
# LOGOUT admin
# -------------------------
@admin_bp.route("/logout", methods=["POST"])
@admin_token_required
def logout_admin(current_admin):
    return jsonify({"message": "Admin logged out successfully"}), 200


# -------------------------
# AURORA USER SNAPSHOT
# -------------------------
@admin_bp.route("/analytics/aurora/user/<string:user_id>", methods=["GET"])
@admin_token_required
def aurora_user_snapshot(current_admin, user_id):

    data = compute_user_aurora_snapshot(user_id)

    return jsonify({
        "aurora_user_snapshot": data
    }), 200