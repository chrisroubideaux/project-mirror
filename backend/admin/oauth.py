# backend/admin/oauth.py
# admin/oauth.py
import os
import requests
from urllib.parse import urlencode

from flask import request, jsonify, Blueprint, redirect, url_for
from flask_dance.contrib.facebook import make_facebook_blueprint, facebook

from admin.models import Admin, db
from admin.jwt_token import generate_admin_jwt_token
from admin.identity_linking import get_or_create_admin_from_oauth

# Blueprint for admin OAuth
admin_oauth_bp = Blueprint("admin_oauth", __name__, url_prefix="/auth/admin")

def current_session_admin():
    """Optional: return currently logged-in admin for identity linking"""
    return getattr(request, "current_admin", None)

# =========================
# GOOGLE OAUTH
# =========================
@admin_oauth_bp.route("/google/login")
def start_google_oauth():
    params = {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "redirect_uri": "http://localhost:5000/auth/admin/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    return redirect("https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params))


@admin_oauth_bp.route("/google/callback")
def google_callback():
    code = request.args.get("code")
    if not code:
        return jsonify({"error": "Missing code"}), 400

    token_res = requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uri": "http://localhost:5000/auth/admin/google/callback",
            "grant_type": "authorization_code",
        },
    )

    if token_res.status_code != 200:
        return jsonify({"error": "Token exchange failed"}), 400

    access_token = token_res.json().get("access_token")
    userinfo = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    ).json()

    # Link or create admin
    admin = get_or_create_admin_from_oauth(
        provider="google",
        provider_user_id=userinfo.get("sub"),
        email=userinfo.get("email"),
        email_verified=bool(userinfo.get("email_verified")),
        full_name=userinfo.get("name"),
        avatar_url=userinfo.get("picture"),
        session_admin=current_session_admin(),
    )

    # ✅ Token always has role=admin
    token = generate_admin_jwt_token(str(admin.id), admin.email)

    return redirect(
        f"http://localhost:3000/admin/{admin.id}?token={token}&name={admin.full_name}"
    )

# =========================
# FACEBOOK OAUTH
# =========================
admin_facebook = make_facebook_blueprint(
    client_id=os.getenv("FACEBOOK_CLIENT_ID"),
    client_secret=os.getenv("FACEBOOK_CLIENT_SECRET"),
    scope=["public_profile", "email"],
    redirect_url="/auth/admin/facebook/callback",
)


@admin_oauth_bp.route("/facebook/login")
def start_facebook_oauth():
    return redirect(url_for("admin_facebook.login"))


@admin_oauth_bp.route("/facebook/callback")
def facebook_callback():
    if not facebook.authorized:
        return redirect("/admin/login")

    resp = facebook.get("/me?fields=id,name,email,picture.type(large)")
    if not resp.ok:
        return jsonify({"error": "Facebook API call failed"}), 400

    info = resp.json()
    email = info.get("email")
    name = info.get("name")
    picture = (info.get("picture") or {}).get("data", {}).get("url")

    # Link or create admin
    admin = get_or_create_admin_from_oauth(
        provider="facebook",
        provider_user_id=info.get("id"),
        email=email,
        email_verified=bool(email),  
        full_name=name,
        avatar_url=picture,
        session_admin=current_session_admin(),
    )

    # ✅ Token always has role=admin
    token = generate_admin_jwt_token(str(admin.id), admin.email)

    return redirect(
        f"http://localhost:3000/admin/{admin.id}?token={token}&name={admin.full_name}"
    )

