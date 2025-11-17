# backend/users/oauth.py

import os
import logging
import requests
from uuid import uuid4
from datetime import datetime
from urllib.parse import urlencode
from flask import Blueprint, jsonify, redirect, request
from werkzeug.security import generate_password_hash

from .models import User
from extensions import db
from utils.jwt_token import generate_jwt_token

oauth_bp = Blueprint("oauth", __name__, url_prefix="/auth")
logging.basicConfig(level=logging.DEBUG)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")
SERVER_BASE_URL = "http://localhost:5000"


# ============================================================
# GOOGLE OAUTH (Manual flow)
# ============================================================

@oauth_bp.route("/google/login")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = f"{SERVER_BASE_URL}/auth/google/callback"

    query = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "prompt": "consent",
        "access_type": "offline"
    }

    return redirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(query))

# Google OAuth callback
@oauth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code"}), 400

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = f"{SERVER_BASE_URL}/auth/google/callback"

    # Exchange code for token
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    token_res = requests.post("https://oauth2.googleapis.com/token", data=token_data)
    access_token = token_res.json().get("access_token")

    # Get user info
    info_res = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    info = info_res.json()

    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")

    # Create or get user
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            oauth_provider="google",
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(user)
        db.session.commit()

    token = generate_jwt_token(str(user.id), user.email)

    # 🚨 FIXED: send user back to login page → Login.tsx handles the redirect to profile
    return redirect(f"{FRONTEND_URL}/login?token={token}&id={user.id}")


# ============================================================
# FACEBOOK OAUTH (Manual flow)
# ============================================================

@oauth_bp.route("/facebook/login")
def facebook_login():
    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    redirect_uri = f"{SERVER_BASE_URL}/auth/facebook/callback"

    query = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "email,public_profile",
        "response_type": "code"
    }

    return redirect("https://www.facebook.com/v19.0/dialog/oauth?" + urlencode(query))

# Facebook OAuth callback
@oauth_bp.route("/facebook/callback")
def facebook_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code from Facebook"}), 400

    client_id = os.getenv("FACEBOOK_CLIENT_ID")
    client_secret = os.getenv("FACEBOOK_CLIENT_SECRET")
    redirect_uri = f"{SERVER_BASE_URL}/auth/facebook/callback"

    # Exchange code for access token
    token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": code,
    }

    token_res = requests.get(token_url, params=params)
    access_token = token_res.json().get("access_token")

    if not access_token:
        return jsonify({"error": "Failed to obtain access token"}), 400

    # Fetch user data
    user_res = requests.get(
        "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)",
        params={"access_token": access_token}
    )

    info = user_res.json()
    email = info.get("email")
    name = info.get("name")
    picture = (
        info.get("picture", {})
        .get("data", {})
        .get("url")
    )

    if not email:
        return jsonify({"error": "Facebook did not return an email"}), 400

    # Create user if needed
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            oauth_provider="facebook",
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(user)
        db.session.commit()

    # Issue JWT
    token = generate_jwt_token(str(user.id), user.email)

    # 🚨 FIXED: redirect to the login page — NOT the profile page
    return redirect(f"{FRONTEND_URL}/login?token={token}&id={user.id}")


""""""""""
import os
import logging
import requests
from uuid import uuid4
from datetime import datetime
from urllib.parse import urlencode

from flask import request, jsonify, Blueprint, redirect, url_for, session
from werkzeug.security import generate_password_hash
from flask_dance.contrib.facebook import facebook

from .models import User
from extensions import db
from utils.jwt_token import generate_jwt_token

oauth_bp = Blueprint("oauth", __name__, url_prefix="/auth")
logging.basicConfig(level=logging.DEBUG)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")


# -------------------------
# Helper: serialize user
# -------------------------
def serialize_user(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "profile_image_url": user.profile_image_url,
    }


# ==============================
# GOOGLE OAuth Redirect Flow
# ==============================
@oauth_bp.route("/google/login", methods=["GET"])
def start_google_oauth():
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = "http://localhost:5000/auth/google/callback"

    plan_id = request.args.get("planId")  # optional plan

    query_params = {
        "client_id": google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": plan_id or "",
    }

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(query_params)
    return redirect(auth_url)


@oauth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    plan_id_from_state = request.args.get("state") or None
    if not code:
        return jsonify({"error": "Missing code from Google"}), 400

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = "http://localhost:5000/auth/google/callback"

    # --- Exchange code for access token ---
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    token_res = requests.post(token_url, data=data)
    if token_res.status_code != 200:
        return jsonify({"error": "Failed to exchange code"}), 400

    access_token = token_res.json().get("access_token")

    # --- Get user info ---
    userinfo_res = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    if userinfo_res.status_code != 200:
        return jsonify({"error": "Failed to get user info"}), 400

    info = userinfo_res.json()
    logging.debug(f"Google user info: {info}")

    email = info.get("email")
    name = info.get("name")
    picture = info.get("picture")

    if not email:
        return jsonify({"error": "Email not provided"}), 400

    # --- Ensure user in DB ---
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(user)
        db.session.commit()

    # --- Generate JWT with role=user ---
    jwt_token = generate_jwt_token(str(user.id), user.email)

    # --- Redirect to frontend ---
    qs = f"?token={jwt_token}&id={user.id}&role=user&name={user.full_name}"
    if plan_id_from_state:
        qs += f"&planId={plan_id_from_state}&resumeCheckout=1"

    return redirect(f"{FRONTEND_URL}/profile/{user.id}{qs}")


# ==============================
# FACEBOOK OAuth Redirect Flow
# ==============================
@oauth_bp.route("/facebook/login", methods=["GET"])
def start_facebook_oauth():
    plan_id = request.args.get("planId")
    if plan_id:
        session["pending_plan_id"] = plan_id
    return redirect(url_for("facebook.login"))


@oauth_bp.route("/facebook/callback")
def facebook_callback():
    if not facebook.authorized:
        return redirect("/login")

    resp = facebook.get("/me?fields=id,name,email,picture.type(large)")
    if not resp.ok:
        return jsonify({"error": "Facebook API call failed"}), 400

    info = resp.json()
    logging.debug(f"Facebook user info: {info}")

    email = info.get("email")
    name = info.get("name")
    picture = (info.get("picture") or {}).get("data", {}).get("url")

    if not email:
        return jsonify({"error": "No email returned from Facebook"}), 400

    # --- Ensure user in DB ---
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(
            id=str(uuid4()),
            email=email,
            full_name=name,
            profile_image_url=picture,
            password_hash=generate_password_hash(str(uuid4())),
            created_at=datetime.utcnow(),
        )
        db.session.add(user)
        db.session.commit()

    # --- Generate JWT with role=user ---
    jwt_token = generate_jwt_token(str(user.id), user.email)

    plan_id = session.pop("pending_plan_id", None)

    qs = f"?token={jwt_token}&id={user.id}&role=user&name={user.full_name}"
    if plan_id:
        qs += f"&planId={plan_id}&resumeCheckout=1"

    return redirect(f"{FRONTEND_URL}/profile/{user.id}{qs}")
    
"""""