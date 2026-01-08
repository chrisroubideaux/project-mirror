# backend/admin/oauth.py

import os
import logging
import requests
from uuid import uuid4
from datetime import datetime
from urllib.parse import urlencode
from flask import Blueprint, jsonify, redirect, request
from werkzeug.security import generate_password_hash

from .models import Admin
from extensions import db
from .jwt_token import generate_admin_jwt_token

admin_oauth_bp = Blueprint("admin_oauth", __name__, url_prefix="/auth/admin")
logging.basicConfig(level=logging.DEBUG)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
SERVER_BASE_URL = os.getenv("SERVER_BASE_URL", "http://localhost:5000").rstrip("/")


# ============================================================
# GOOGLE OAUTH (Manual flow)
# ============================================================

@admin_oauth_bp.route("/google/login")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = f"{SERVER_BASE_URL}/auth/admin/google/callback"

    query = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "prompt": "consent",
        "access_type": "offline",
    }

    return redirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(query))


@admin_oauth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code"}), 400

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = f"{SERVER_BASE_URL}/auth/admin/google/callback"

    # Exchange code for token
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    token_res = requests.post("https://oauth2.googleapis.com/token", data=token_data)
    access_token = (token_res.json() or {}).get("access_token")

    if not access_token:
        return jsonify({"error": "Google token exchange failed", "details": token_res.json()}), 400

    # Get user info
    info_res = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    info = info_res.json() or {}

    email = info.get("email")
    name = info.get("name") or "Admin"
    picture = info.get("picture")

    if not email:
        return jsonify({"error": "Google did not return an email"}), 400

    # Create or get admin
    admin = Admin.query.filter_by(email=email).first()
    if not admin:
        admin = Admin(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            oauth_provider="google",
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(admin)
        db.session.commit()

    token = generate_admin_jwt_token(str(admin.id), admin.email)

    # Redirect to ADMIN login page (frontend will store token + redirect)
    return redirect(f"{FRONTEND_URL}/admin/login?token={token}&id={admin.id}")


# ============================================================
# FACEBOOK OAUTH (Manual flow)
# ============================================================

@admin_oauth_bp.route("/facebook/login")
def facebook_login():
    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    redirect_uri = f"{SERVER_BASE_URL}/auth/admin/facebook/callback"

    query = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "email,public_profile",
        "response_type": "code",
    }

    return redirect("https://www.facebook.com/v19.0/dialog/oauth?" + urlencode(query))


@admin_oauth_bp.route("/facebook/callback")
def facebook_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code from Facebook"}), 400

    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    client_secret = os.getenv("FACEBOOK_CLIENT_SECRET")
    redirect_uri = f"{SERVER_BASE_URL}/auth/admin/facebook/callback"

    # Exchange code for access token
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    }

    token_res = requests.get(token_url, params=params)
    access_token = (token_res.json() or {}).get("access_token")

    if not access_token:
        return jsonify({"error": "Failed to obtain access token", "details": token_res.json()}), 400

    # Fetch user data
    admin_res = requests.get(
        "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)",
        params={"access_token": access_token},
    )

    info = admin_res.json() or {}
    email = info.get("email")
    name = info.get("name") or "Admin"
    picture = (info.get("picture") or {}).get("data", {}).get("url")

    if not email:
        return jsonify({"error": "Facebook did not return an email"}), 400

    # Create admin if needed
    admin = Admin.query.filter_by(email=email).first()
    if not admin:
        admin = Admin(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            oauth_provider="facebook",
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(admin)
        db.session.commit()

    token = generate_admin_jwt_token(str(admin.id), admin.email)

    # Redirect to ADMIN login page (frontend will store token + redirect)
    return redirect(f"{FRONTEND_URL}/admin/login?token={token}&id={admin.id}")
