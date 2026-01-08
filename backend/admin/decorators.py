# backend/admin/decorators.py
# Admin-only JWT decorators

import os
import jwt
from functools import wraps
from flask import request, jsonify
from admin.models import Admin

SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret")


def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight
        if request.method == "OPTIONS":
            return "", 200

        token = None
        auth = request.headers.get("Authorization", "")
        parts = auth.split()

        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

        if not token:
            return jsonify({"error": "Token is missing!"}), 401

        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])

            # 🔒 ADMIN ONLY
            if payload.get("role") != "admin":
                return jsonify({"error": "Forbidden: admin token required"}), 403

            admin_id = payload.get("id") or payload.get("admin_id")
            if not admin_id:
                return jsonify({"error": "Invalid token payload: missing id"}), 401

            current_admin = Admin.query.get(admin_id)
            if not current_admin:
                return jsonify({"error": "Admin not found"}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

        return f(current_admin, *args, **kwargs)

    return decorated
