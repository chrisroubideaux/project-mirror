# backend/users/__init__.py

from flask import Blueprint

user_bp = Blueprint("users", __name__, url_prefix="/api/users")

# Import routes so they attach to user_bp
from . import routes  # noqa: E402,F401
