# backend/admin/oauth.py
import os
import requests
from urllib.parse import urlencode

from flask import Blueprint, request, jsonify, redirect, url_for
from flask_dance.contrib.facebook import make_facebook_blueprint, facebook
from flask_jwt_extended import create_access_token

from admin.identity_linking import get_or_create_admin_from_oauth

# ============================================================
# Blueprint
# ============================================================

admin_oauth_bp = Blueprint("admin_oauth", __name__, url_prefix="/auth/admin")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
SERVER_BASE_URL = os.getenv("SERVER_BASE_URL", "http://localhost:5000").rstrip("/")


def current_session_admin():
    """
    Optional helper for identity linking
    """
    return getattr(request, "current_admin", None)


# ============================================================
# GOOGLE OAUTH (MANUAL FLOW)
# ============================================================

@admin_oauth_bp.route("/google/login")
def google_login():
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": f"{SERVER_BASE_URL}/auth/admin/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }

    return redirect(
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(params)
    )


@admin_oauth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code"}), 400

    # Exchange code for access token
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": f"{SERVER_BASE_URL}/auth/admin/google/callback",
            "grant_type": "authorization_code",
        },
    )

    if token_res.status_code != 200:
        return jsonify({
            "error": "Google token exchange failed",
            "details": token_res.json(),
        }), 400

    access_token = token_res.json().get("access_token")
    if not access_token:
        return jsonify({"error": "No access token returned"}), 400

    # Fetch user info
    info = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    # Resolve or create admin
    admin = get_or_create_admin_from_oauth(
        provider="google",
        provider_user_id=info.get("sub"),
        email=info.get("email"),
        email_verified=bool(info.get("email_verified")),
        full_name=info.get("name"),
        avatar_url=info.get("picture"),
        session_admin=current_session_admin(),
    )

    # ✅ CREATE ADMIN TOKEN (flask_jwt_extended ONLY)
    admin_token = create_access_token(
        identity=str(admin.id),
        additional_claims={
            "role": "admin",
            "email": admin.email,
        },
    )

    return redirect(
        f"{FRONTEND_URL}/admin/login"
        f"?admin_token={admin_token}&admin_id={admin.id}"
    )


# ============================================================
# FACEBOOK OAUTH (FLASK-DANCE)
# ============================================================

admin_facebook_bp = make_facebook_blueprint(
    client_id=os.getenv("FACEBOOK_CLIENT_ID"),
    client_secret=os.getenv("FACEBOOK_CLIENT_SECRET"),
    scope=["public_profile", "email"],
    redirect_url="/auth/admin/facebook/callback",
)


@admin_oauth_bp.route("/facebook/login")
def facebook_login():
    return redirect(url_for("admin_facebook.login"))


@admin_oauth_bp.route("/facebook/callback")
def facebook_callback():
    if not facebook.authorized:
        return redirect(f"{FRONTEND_URL}/admin/login")

    resp = facebook.get("/me?fields=id,name,email,picture.type(large)")
    if not resp.ok:
        return jsonify({"error": "Facebook API call failed"}), 400

    info = resp.json() or {}

    admin = get_or_create_admin_from_oauth(
        provider="facebook",
        provider_user_id=info.get("id"),
        email=info.get("email"),
        email_verified=bool(info.get("email")),
        full_name=info.get("name"),
        avatar_url=(info.get("picture") or {}).get("data", {}).get("url"),
        session_admin=current_session_admin(),
    )

    # ✅ CREATE ADMIN TOKEN (flask_jwt_extended ONLY)
    admin_token = create_access_token(
        identity=str(admin.id),
        additional_claims={
            "role": "admin",
            "email": admin.email,
        },
    )

    return redirect(
        f"{FRONTEND_URL}/admin/login"
        f"?admin_token={admin_token}&admin_id={admin.id}"
    )



"""""""""""
# backend/admin/oauth.py

import os
import logging
import requests
from uuid import uuid4
from datetime import datetime
from urllib.parse import urlencode
from flask import Blueprint, jsonify, redirect, request
from werkzeug.security import generate_password_hash
from extensions import db
from .models import Admin
from .jwt_token import generate_admin_jwt_token


admin_oauth_bp = Blueprint("admin_oauth", __name__, url_prefix="/auth/admin")
logging.basicConfig(level=logging.DEBUG)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
SERVER_BASE_URL = os.getenv("SERVER_BASE_URL", "http://localhost:5000").rstrip("/")


# ============================================================
# GOOGLE OAUTH
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

    return redirect(
        "https://accounts.google.com/o/oauth2/v2/auth?"
        + urlencode(query)
    )


@admin_oauth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code"}), 400

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = f"{SERVER_BASE_URL}/auth/admin/google/callback"

    # Exchange code for access token
    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
        },
    )

    token_json = token_res.json() or {}
    access_token = token_json.get("access_token")

    if not access_token:
        return jsonify({
            "error": "Google token exchange failed",
            "details": token_json
        }), 400

    # Fetch user info
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

    # --------------------------------------------------------
    # CREATE OR FETCH ADMIN (THIS WAS THE MISSING PIECE)
    # --------------------------------------------------------
    admin = Admin.query.filter_by(email=email).first()

    if not admin:
        admin = Admin(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            oauth_provider="google",
            role="admin",
            is_active=True,
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(admin)
        db.session.commit()

    token = generate_admin_jwt_token(str(admin.id), admin.email)

    return redirect(
        f"{FRONTEND_URL}/admin/login?token={token}&id={admin.id}"
    )


# ============================================================
# FACEBOOK OAUTH
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

    return redirect(
        "https://www.facebook.com/v19.0/dialog/oauth?"
        + urlencode(query)
    )


@admin_oauth_bp.route("/facebook/callback")
def facebook_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code from Facebook"}), 400

    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    client_secret = os.getenv("FACEBOOK_CLIENT_SECRET")
    redirect_uri = f"{SERVER_BASE_URL}/auth/admin/facebook/callback"

    # Exchange code for access token
    token_res = requests.get(
        "https://graph.facebook.com/v19.0/oauth/access_token",
        params={
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": redirect_uri,
            "code": code,
        },
    )

    token_json = token_res.json() or {}
    access_token = token_json.get("access_token")

    if not access_token:
        return jsonify({
            "error": "Failed to obtain Facebook access token",
            "details": token_json
        }), 400

    # Fetch user info
    info_res = requests.get(
        "https://graph.facebook.com/me",
        params={
            "fields": "id,name,email,picture.type(large)",
            "access_token": access_token,
        },
    )

    info = info_res.json() or {}
    email = info.get("email")
    name = info.get("name") or "Admin"
    picture = (info.get("picture") or {}).get("data", {}).get("url")

    if not email:
        return jsonify({"error": "Facebook did not return an email"}), 400

    # --------------------------------------------------------
    # CREATE OR FETCH ADMIN
    # --------------------------------------------------------
    admin = Admin.query.filter_by(email=email).first()

    if not admin:
        admin = Admin(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            oauth_provider="facebook",
            role="admin",
            is_active=True,
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(admin)
        db.session.commit()

    token = generate_admin_jwt_token(str(admin.id), admin.email)

    return redirect(
        f"{FRONTEND_URL}/admin/login?token={token}&id={admin.id}"
    )


    
    
"""""""""""""""
