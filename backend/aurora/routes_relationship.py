# backend/aurora/routes_relationship.py
from flask import Blueprint, jsonify, request
from aurora.relationship import get_or_create_relationship, update_on_message, apply_ritual_preference

# Replace these with your actual decorators
from users.auth import token_required
from admin.auth import admin_token_required

aurora_relationship_bp = Blueprint("aurora_relationship_bp", __name__, url_prefix="/api/user/aurora")

@aurora_relationship_bp.get("/relationship")
@token_required
def get_relationship(current_user):
    rel = get_or_create_relationship(current_user.id)

    # user-safe view: no admin-only flags beyond basic booleans
    data = rel.to_dict()
    data["flags_json"] = {
        "prefers_concise": (rel.flags_json or {}).get("prefers_concise", False),
        "safety_flag_triggered": (rel.flags_json or {}).get("safety_flag_triggered", False),
    }
    return jsonify(data), 200

@aurora_relationship_bp.post("/relationship/rituals")
@token_required
def set_rituals(current_user):
    payload = request.get_json(force=True) or {}
    preferred_name = payload.get("preferred_name")
    prefers_concise = payload.get("prefers_concise")

    rel = apply_ritual_preference(
        current_user.id,
        preferred_name=preferred_name,
        prefers_concise=prefers_concise,
    )
    return jsonify(rel.to_dict()), 200


# ADMIN (separate blueprint/path is fine too)
admin_aurora_rel_bp = Blueprint("admin_aurora_rel_bp", __name__, url_prefix="/api/admin/aurora")

@admin_aurora_rel_bp.get("/relationship/<user_id>")
@admin_token_required
def admin_get_relationship(current_admin, user_id):
    from aurora.models_relationship import AuroraRelationship
    rel = AuroraRelationship.query.filter_by(user_id=user_id).first()
    if not rel:
        return jsonify({"error": "not_found"}), 404
    return jsonify(rel.to_dict()), 200
