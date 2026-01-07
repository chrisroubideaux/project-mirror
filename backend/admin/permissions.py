# backend/admin/permissions.py

from functools import wraps
from flask import jsonify

def require_role(*roles):
    """
    Restrict access to admins with certain roles.
    Example: @require_role("super_admin", "content_admin")
    """
    def decorator(f):
        @wraps(f)
        def wrapper(current_admin, *args, **kwargs):
            if current_admin.role not in roles:
                return jsonify({
                    "error": "Forbidden",
                    "message": f"Requires role: {', '.join(roles)}"
                }), 403
            return f(current_admin, *args, **kwargs)
        return wrapper
    return decorator