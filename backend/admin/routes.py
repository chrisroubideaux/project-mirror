# backend/admin/models.py
# admin/routes.py
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from uuid import uuid4
from extensions import db
from .models import Admin
from users.models import User
from .jwt_token import generate_admin_jwt_token
from .decorators import admin_token_required

admin_bp = Blueprint('admins', __name__, url_prefix='/api/admins')


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
# LOGIN admin
# -------------------------
@admin_bp.route('/login', methods=['POST'])
def login_admin():
    data = request.get_json() or {}
    admin = Admin.query.filter_by(email=data.get('email')).first()
    if not admin or not check_password_hash(admin.password_hash, data.get('password') or ''):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = generate_admin_jwt_token(str(admin.id), admin.email)
    return jsonify({'message': 'Login successful', 'admin_id': str(admin.id), 'token': token}), 200


# -------------------------
# GET all admins
# -------------------------
@admin_bp.route('/', methods=['GET'])
@admin_token_required
def get_all_admins(current_admin):
    admins = Admin.query.all()
    return jsonify([{
        'admin_id': str(a.id),
        'full_name': a.full_name,
        'email': a.email,
        'bio': a.bio,
        'address': a.address,
        'phone_number': a.phone_number,
        'profile_image_url': a.profile_image_url,
        'profile_banner_url': a.profile_banner_url,
        'role': a.role,
        'experience_level': a.experience_level,
        'experience_years': a.experience_years,
        'certifications': a.certifications,
        'specialties': a.specialties,
        'membership_plan_id': str(a.membership_plan_id) if a.membership_plan_id else None
    } for a in admins]), 200

# -------------------------
# GET all admins (public - guest access)
# -------------------------
@admin_bp.route('/public', methods=['GET'])
def get_all_admins_public():
    admins = Admin.query.all()
    return jsonify([{
        'admin_id': str(a.id),
        'full_name': a.full_name,
        'bio': a.bio,
        'profile_image_url': a.profile_image_url,
        'profile_banner_url': a.profile_banner_url,
        'role': a.role,
        'experience_level': a.experience_level,
        'experience_years': a.experience_years,
        'specialties': a.specialties,
    } for a in admins]), 200

# -------------------------
# GET single admin (public)
# -------------------------
@admin_bp.route('/public/<string:admin_id>', methods=['GET'])
def get_admin_public(admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404

    return jsonify({
        "admin_id": str(admin.id),
        "full_name": admin.full_name,
        "bio": admin.bio,
        "address": admin.address,
        "phone_number": admin.phone_number,
        "profile_image_url": admin.profile_image_url,
        "profile_banner_url": admin.profile_banner_url,
        "role": admin.role,
        "experience_level": admin.experience_level,
        "experience_years": admin.experience_years,
        "certifications": admin.certifications,
        "specialties": admin.specialties,
        "email": admin.email,
    }), 200



# -------------------------
# GET single admin by ID
# -------------------------
@admin_bp.route('/<string:admin_id>', methods=['GET'])
@admin_token_required
def get_admin(current_admin, admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404
    return jsonify({
        'admin_id': str(admin.id),
        'full_name': admin.full_name,
        'email': admin.email,
        'bio': admin.bio,
        'address': admin.address,
        'phone_number': admin.phone_number,
        'profile_image_url': admin.profile_image_url,
        'profile_banner_url': admin.profile_banner_url,
        'role': admin.role,
        'experience_level': admin.experience_level,
        'experience_years': admin.experience_years,
        'certifications': admin.certifications,
        'specialties': admin.specialties,
        'membership_plan_id': str(admin.membership_plan_id) if admin.membership_plan_id else None
    }), 200


# -------------------------
# UPDATE admin
# -------------------------
@admin_bp.route('/<string:admin_id>', methods=['PUT'])
@admin_token_required
def update_admin(current_admin, admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404

    # Allow any logged-in admin to update themselves
    if str(current_admin.id) != admin_id:
        return jsonify({'error': 'Forbidden - you can only update your own profile'}), 403

    data = request.get_json() or {}
    admin.full_name = data.get('full_name', admin.full_name)
    admin.bio = data.get('bio', admin.bio)
    admin.address = data.get('address', admin.address)
    admin.phone_number = data.get('phone', admin.phone_number)
    admin.profile_image_url = data.get('profile_image', admin.profile_image_url)
    admin.profile_banner_url = data.get('profile_banner_url', admin.profile_banner_url)
    admin.age = data.get('age', admin.age)
    admin.weight = data.get('weight', admin.weight)
    admin.height = data.get('height', admin.height)
    admin.gender = data.get('gender', admin.gender)
    admin.fitness_goal = data.get('fitness_goal', admin.fitness_goal)
    admin.activity_level = data.get('activity_level', admin.activity_level)
    admin.experience_level = data.get('experience_level', admin.experience_level)
    admin.experience_years = data.get('experience_years', admin.experience_years)
    admin.certifications = data.get('certifications', admin.certifications)
    admin.specialties = data.get('specialties', admin.specialties)
    admin.medical_conditions = data.get('medical_conditions', admin.medical_conditions)
    admin.role = data.get('role', admin.role)
    admin.membership_plan_id = data.get('membership_plan_id', admin.membership_plan_id)

    db.session.commit()
    return jsonify({'message': 'Admin updated successfully'}), 200


# -------------------------
# DELETE admin
# -------------------------
@admin_bp.route('/<string:admin_id>', methods=['DELETE'])
@admin_token_required
def delete_admin(current_admin, admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404
    db.session.delete(admin)
    db.session.commit()
    return jsonify({'message': f"Admin '{admin.full_name}' deleted"}), 200

# -------------------------
# TEST: Update admin (no token required)
# -------------------------
@admin_bp.route('/test/<string:admin_id>', methods=['PUT'])
def update_admin_no_token(admin_id):
    admin = Admin.query.get(admin_id)
    if not admin:
        return jsonify({'error': 'Admin not found'}), 404

    data = request.get_json() or {}

    admin.full_name = data.get('full_name', admin.full_name)
    admin.bio = data.get('bio', admin.bio)
    admin.address = data.get('address', admin.address)
    admin.phone_number = data.get('phone_number', admin.phone_number)
    admin.profile_image_url = data.get('profile_image_url', admin.profile_image_url)
    admin.profile_banner_url = data.get('profile_banner_url', admin.profile_banner_url)
    admin.age = data.get('age', admin.age)
    admin.weight = data.get('weight', admin.weight)
    admin.height = data.get('height', admin.height)
    admin.gender = data.get('gender', admin.gender)
    admin.fitness_goal = data.get('fitness_goal', admin.fitness_goal)
    admin.activity_level = data.get('activity_level', admin.activity_level)
    admin.experience_level = data.get('experience_level', admin.experience_level)
    admin.experience_years = data.get('experience_years', admin.experience_years)
    admin.certifications = data.get('certifications', admin.certifications)
    admin.specialties = data.get('specialties', admin.specialties)
    admin.medical_conditions = data.get('medical_conditions', admin.medical_conditions)
    admin.role = data.get('role', admin.role)
    admin.membership_plan_id = data.get('membership_plan_id', admin.membership_plan_id)

    db.session.commit()
    return jsonify({'message': f'Admin {admin.full_name} updated successfully (NO TOKEN)'}), 200





# -------------------------
# GET current admin profile
# -------------------------
@admin_bp.route('/me', methods=['GET'])
@admin_token_required
def get_admin_profile(current_admin):
    return jsonify({
        'id': str(current_admin.id),
        'email': current_admin.email,
        'full_name': current_admin.full_name,
        'profile_image_url': current_admin.profile_image_url,
        'profile_banner_url': current_admin.profile_banner_url,
        'bio': current_admin.bio,
        'address': current_admin.address,
        'phone': current_admin.phone_number,
        'role': current_admin.role,
        'experience_level': current_admin.experience_level,
        'experience_years': current_admin.experience_years,
        'certifications': current_admin.certifications,
        'specialties': current_admin.specialties,
        'membership_plan_id': str(current_admin.membership_plan_id) if current_admin.membership_plan_id else None
    }), 200


# -------------------------
# GET all users (open for admins)
# -------------------------
@admin_bp.route('/users', methods=['GET'])
@admin_token_required
def get_all_users_as_admin(current_admin):
    limit = request.args.get("limit", type=int)
    q = User.query
    if limit:
        q = q.limit(limit)

    users = q.all()
    return jsonify([{
        'id': str(u.id),
        'full_name': u.full_name,
        'email': u.email,
        'bio': u.bio,
        'address': u.address,
        'phone_number': u.phone_number,
        'profile_image_url': u.profile_image_url,
        'membership_plan_id': str(u.membership_plan_id) if u.membership_plan_id else None,
        'plan_name': u.membership_plan.name if getattr(u, "membership_plan", None) else "Free",
        'plan_price': u.membership_plan.price if getattr(u, "membership_plan", None) else 0.0,
        'plan_features': u.membership_plan.features if getattr(u, "membership_plan", None) else []
    } for u in users]), 200


# -------------------------
# DELETE any user (open for admins)
# -------------------------
@admin_bp.route('/delete_user/<string:user_id>', methods=['DELETE'])
@admin_token_required
def delete_any_user(current_admin, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f"Admin '{current_admin.full_name}' deleted user '{user.full_name}'"}), 200


# -------------------------
# LOGOUT admin
# -------------------------
@admin_bp.route('/logout', methods=['POST'])
@admin_token_required
def logout_admin(current_admin):
    return jsonify({'message': 'Admin logged out successfully'}), 200