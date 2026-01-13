# backend/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

# Flask-Limiter
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


# ----------------------------------------------------
# Database
# ----------------------------------------------------
db = SQLAlchemy()

# ----------------------------------------------------
# JWT
# ----------------------------------------------------
jwt = JWTManager()

# ----------------------------------------------------
# Rate Limiter (GLOBAL)
# ----------------------------------------------------
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)


"""""""""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()


"""""