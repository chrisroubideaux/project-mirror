# backend/users/identity_linking.py

from uuid import uuid4
from werkzeug.security import generate_password_hash
from extensions import db
from .models import User, UserIdentity


def _norm_email(email: str | None) -> str | None:
    return email.strip().lower() if email else None


def _find_identity(provider: str, provider_user_id: str) -> UserIdentity | None:
    return UserIdentity.query.filter_by(
        provider=provider,
        provider_user_id=provider_user_id
    ).one_or_none()


def _by_verified_email(email_norm: str | None) -> User | None:
    return User.query.filter_by(email=email_norm).one_or_none() if email_norm else None


def _link_identity(
    user: User,
    *,
    provider: str,
    provider_user_id: str,
    email: str | None,
    email_verified: bool
) -> UserIdentity:
    existing = _find_identity(provider, provider_user_id)
    email_norm = _norm_email(email)

    if existing:
        if existing.user_id != user.id:
            raise ValueError("This OAuth account is already linked to another user.")
        changed = False
        if existing.email_at_auth_time != email_norm:
            existing.email_at_auth_time = email_norm
            changed = True
        if email_verified and not existing.email_verified:
            existing.email_verified = True
            changed = True
        if changed:
            db.session.add(existing)
        return existing

    ident = UserIdentity(
        id=uuid4(),
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id,
        email_at_auth_time=email_norm,
        email_verified=email_verified
    )
    db.session.add(ident)
    return ident


def get_or_create_user_from_oauth(
    *,
    provider: str,
    provider_user_id: str,
    email: str | None,
    email_verified: bool,
    full_name: str | None,
    avatar_url: str | None,
) -> User:
    # 1) Identity exists → return
    identity = _find_identity(provider, provider_user_id)
    if identity:
        return identity.user

    # 2) Match by verified email
    email_norm = _norm_email(email)
    if email_norm and email_verified:
        existing_user = _by_verified_email(email_norm)
        if existing_user:
            _link_identity(
                existing_user,
                provider=provider,
                provider_user_id=provider_user_id,
                email=email,
                email_verified=email_verified
            )
            db.session.commit()
            return existing_user

    # 3) Create new user + identity
    user = User(
        id=uuid4(),
        email=email_norm or f"{provider_user_id}@noemail.{provider}",
        full_name=full_name or "User",
        profile_image_url=avatar_url,
        password_hash=generate_password_hash(str(uuid4())),
        oauth_provider=provider,   # keep legacy filled for now
        oauth_id=provider_user_id, # legacy convenience
        is_active=True,
    )
    db.session.add(user)

    _link_identity(
        user,
        provider=provider,
        provider_user_id=provider_user_id,
        email=email,
        email_verified=email_verified
    )

    db.session.commit()
    return user
