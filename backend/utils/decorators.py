# backend/utils/decorators.py

import os, jwt
from functools import wraps
from flask import request, jsonify
from users.models import User

SECRET = os.getenv("SECRET_KEY")   # or JWT_SECRET_KEY

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
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
            user_id = payload.get("id") or payload.get("user_id")
            if not user_id:
                return jsonify({"error": "Invalid token payload: missing id"}), 401

            current_user = User.query.get(user_id)
            if not current_user:
                return jsonify({"error": "User not found"}), 404
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": f"Server error: {str(e)}"}), 500

        return f(current_user, *args, **kwargs)
    return decorated


def token_required_optional(f):
    """Same as token_required, but allows missing/invalid tokens (passes current_user=None)."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return "", 200

        token = None
        auth = request.headers.get("Authorization", "")
        parts = auth.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]

        if not token:
            # No token at all → treat as guest
            return f(None, *args, **kwargs)

        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            user_id = payload.get("id") or payload.get("user_id")
            current_user = User.query.get(user_id) if user_id else None
        except Exception:
            current_user = None  # invalid token → treat as guest

        return f(current_user, *args, **kwargs)
    return decorated