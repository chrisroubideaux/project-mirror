# backend/admin/decorators.py
import os
import jwt
from functools import wraps
from flask import request, jsonify
from admin.models import Admin

SECRET = os.getenv("DB_SECRET_KEY")

def _extract_bearer_token():
    auth = request.headers.get("Authorization", "")
    if auth:
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
    return request.headers.get("x-access-tokens")

def admin_token_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return ("", 200)

        token = _extract_bearer_token()
        if not token:
            return jsonify({"error": "Token is missing"}), 401

        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            print("🔐 Admin JWT payload:", payload)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception as e:
            print(f"❌ JWT decode error: {e}")
            return jsonify({"error": "Invalid token"}), 401

        role = payload.get("role")
        if role and role != "admin":
            return jsonify({"error": "Forbidden: not an admin token"}), 403

        admin_id = payload.get("admin_id") or payload.get("user_id") or payload.get("id")
        if not admin_id:
            return jsonify({"error": "Invalid token payload: admin_id missing"}), 401

        admin = Admin.query.get(admin_id)
        if not admin:
            return jsonify({"error": "Admin not found"}), 404

        return fn(admin, *args, **kwargs)

    return wrapper


def admin_token_required_optional(fn):
    """Optional admin auth. Passes current_admin if token valid, else None."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method == "OPTIONS":
            return ("", 200)

        token = _extract_bearer_token()
        current_admin = None
        if token:
            try:
                payload = jwt.decode(token, SECRET, algorithms=["HS256"])
                role = payload.get("role")
                if role == "admin":
                    admin_id = payload.get("admin_id") or payload.get("id")
                    if admin_id:
                        current_admin = Admin.query.get(admin_id)
            except Exception as e:
                print(f"⚠️ Ignoring invalid/expired admin token: {e}")

        return fn(current_admin, *args, **kwargs)
    return wrapper