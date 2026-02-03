# backend/admin/decorators.py

import uuid
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import (
    verify_jwt_in_request,
    get_jwt,
    get_jwt_identity,
    decode_token,
)

from admin.models import Admin


def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight
        if request.method == "OPTIONS":
            return "", 200

        current_admin = None
        claims = None
        identity = None

        try:
            # ===============================
            # PRIMARY: Authorization header
            # ===============================
            verify_jwt_in_request()

            claims = get_jwt()
            identity = get_jwt_identity()

        except Exception:
            # ===============================
            # FALLBACK: ?token= (CSV export)
            # ===============================
            token = request.args.get("token")
            if not token:
                return jsonify({"error": "Missing token"}), 401

            try:
                decoded = decode_token(token)
                claims = decoded
                identity = decoded.get("sub")
            except Exception:
                return jsonify({"error": "Invalid or expired token"}), 401

        # ===============================
        # ADMIN ROLE CHECK
        # ===============================
        if claims.get("role") != "admin":
            return jsonify({"error": "Forbidden: admin token required"}), 403

        if not identity:
            return jsonify({"error": "Invalid token payload: missing identity"}), 401

        # ===============================
        # UUID + DB CHECK
        # ===============================
        try:
            admin_uuid = uuid.UUID(str(identity))
        except Exception:
            return jsonify({"error": "Invalid admin id in token"}), 401

        current_admin = Admin.query.get(admin_uuid)
        if not current_admin:
            return jsonify({"error": "Admin not found"}), 404

        # ===============================
        # SUCCESS
        # ===============================
        return f(current_admin, *args, **kwargs)

    return decorated





""""""""""""""""""""""""""""""""""""""""
import uuid
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity

from admin.models import Admin


def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow CORS preflight
        if request.method == "OPTIONS":
            return "", 200

        try:
            # Validates Bearer token using JWTManager / JWT_SECRET_KEY
            verify_jwt_in_request()

            claims = get_jwt()            # additional_claims
            identity = get_jwt_identity() # comes from "sub"

            # 🔒 ADMIN ONLY
            if claims.get("role") != "admin":
                return jsonify({"error": "Forbidden: admin token required"}), 403

            if not identity:
                return jsonify({"error": "Invalid token payload: missing identity"}), 401

            # Your Admin PK is UUID(as_uuid=True) → cast identity properly
            try:
                admin_uuid = uuid.UUID(str(identity))
            except Exception:
                return jsonify({"error": "Invalid admin id in token"}), 401

            current_admin = Admin.query.get(admin_uuid)
            if not current_admin:
                return jsonify({"error": "Admin not found"}), 404

        except Exception as e:
            # Most common: missing/expired/invalid token
            return jsonify({"error": "Unauthorized", "details": str(e)}), 401

        return f(current_admin, *args, **kwargs)

    return decorated



"""""""""""""""""""""""""""""""""""""""""