# backend/admin/identity_linking.py
from extensions import db
from admin.models import Admin, AdminIdentity
from uuid import uuid4
from werkzeug.security import generate_password_hash

def _norm_email(email: str | None) -> str | None:
    return email.strip().lower() if email else None

def _by_verified_email(email_norm: str | None) -> Admin | None:
    return Admin.query.filter_by(email=email_norm).one_or_none() if email_norm else None

def _find_identity(provider: str, provider_user_id: str) -> AdminIdentity | None:
    return AdminIdentity.query.filter_by(provider=provider, provider_user_id=provider_user_id).one_or_none()

def _link_identity(admin: Admin, *, provider: str, provider_user_id: str, email: str | None, email_verified: bool) -> AdminIdentity:
    existing = _find_identity(provider, provider_user_id)
    if existing:
        if existing.admin_id != admin.id:
            raise ValueError("This OAuth account is already linked to another admin.")
        changed = False
        email_norm = _norm_email(email)
        if existing.email_at_auth_time != email_norm:
            existing.email_at_auth_time = email_norm
            changed = True
        if email_verified and not existing.email_verified:
            existing.email_verified = True
            changed = True
        if changed:
            db.session.add(existing)
        return existing

    new_identity = AdminIdentity(
        id=uuid4(),
        admin_id=admin.id,
        provider=provider,
        provider_user_id=provider_user_id,
        email_at_auth_time=_norm_email(email),
        email_verified=email_verified
    )
    db.session.add(new_identity)
    return new_identity

def get_or_create_admin_from_oauth(
    *,
    provider: str,
    provider_user_id: str,
    email: str | None,
    email_verified: bool,
    full_name: str | None,
    avatar_url: str | None,
    session_admin: Admin | None = None
) -> Admin:
    # 1) If identity exists, return its admin
    identity = _find_identity(provider, provider_user_id)
    if identity:
        return identity.admin

    # 2) If logged in, link new identity
    if session_admin:
        _link_identity(session_admin,
                       provider=provider,
                       provider_user_id=provider_user_id,
                       email=email,
                       email_verified=email_verified)
        db.session.commit()
        return session_admin

    # 3) Match by verified email
    email_norm = _norm_email(email)
    if email_norm and email_verified:
        existing_admin = _by_verified_email(email_norm)
        if existing_admin:
            _link_identity(existing_admin,
                           provider=provider,
                           provider_user_id=provider_user_id,
                           email=email,
                           email_verified=email_verified)
            db.session.commit()
            return existing_admin

    # 4) Create new admin and identity
    new_admin = Admin(
        id=uuid4(),
        email=email_norm or f"{provider_user_id}@noemail.{provider}",
        full_name=full_name or "Admin",
        profile_image_url=avatar_url,
        password_hash=generate_password_hash(str(uuid4()))
    )
    db.session.add(new_admin)

    _link_identity(new_admin,
                   provider=provider,
                   provider_user_id=provider_user_id,
                   email=email,
                   email_verified=email_verified)

    db.session.commit()
    return new_admin