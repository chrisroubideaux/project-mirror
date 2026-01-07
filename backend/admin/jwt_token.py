# backend/admin/jwt_token.py
import jwt
import os
from datetime import datetime, timedelta

SECRET = os.getenv("DB_SECRET_KEY", "dev-secret")

def generate_admin_jwt_token(admin_id, email, expires_in=3600*24):
    payload = {
        "admin_id": admin_id,    
        "email": email,
        "role": "admin",
        "exp": datetime.utcnow() + timedelta(seconds=expires_in)
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")