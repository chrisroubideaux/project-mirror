from flask import Blueprint

admin_face_bp = Blueprint(
    "admin_face",
    __name__,
    url_prefix="/api/admin/face"
)

# routes are imported here so the blueprint is fully registered
from . import routes  # noqa: E402,F401
