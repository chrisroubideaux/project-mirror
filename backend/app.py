from dotenv import load_dotenv
load_dotenv()  # MUST BE FIRST — before any config access

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate

# Ensure imports work when running from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ----------------------------------------------------
# Extensions (SINGLE SOURCE OF TRUTH)
# ----------------------------------------------------
from extensions import db, jwt, limiter


# ----------------------------------------------------
# Models (needed for migrations / Alembic discovery)
# ----------------------------------------------------
from users.models import User, EmotionalProfile
from admin.models import Admin
from videos.models import Video
from face.models import FaceEmbedding

# ----------------------------------------------------
# Blueprints
# ----------------------------------------------------
# Uploads
from uploads.routes import uploads_bp

# Face login
from face.routes import face_bp
from admin.face.routes import admin_face_bp

# Admin
from admin.routes import admin_bp
from admin.oauth import admin_oauth_bp

# Users
from users.routes import user_bp
from users.oauth import oauth_bp

# Core services
from routes.aurora_routes import aurora_bp
from routes.emotion_routes import emotion_bp
from routes.whisper_routes import whisper_bp

# Videos
from videos import videos_bp

# ----------------------------------------------------
# Migration manager
# ----------------------------------------------------
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # ----------------------------------------------------
    # CORS
    # ----------------------------------------------------
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ----------------------------------------------------
    # Flask Config (FAIL FAST)
    # ----------------------------------------------------
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        raise RuntimeError("SECRET_KEY is not set")

    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        raise RuntimeError("JWT_SECRET_KEY is not set")

    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_port = os.getenv("DB_PORT")
    db_name = os.getenv("DB_NAME")

    if not all([db_user, db_password, db_host, db_port, db_name]):
        raise RuntimeError("Database environment variables are not fully set")

    app.config["SECRET_KEY"] = secret_key
    app.config["JWT_SECRET_KEY"] = jwt_secret

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Optional but recommended
    app.config["JSON_SORT_KEYS"] = False

    # ----------------------------------------------------
    # Init Extensions (INIT ONCE)
    # ----------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    limiter.init_app(app)

    # ----------------------------------------------------
    # Register Blueprints
    # ----------------------------------------------------
    # Admin
    app.register_blueprint(admin_bp)        # /api/admins/*
    app.register_blueprint(admin_oauth_bp)  # /auth/admin/*

    # Users
    app.register_blueprint(user_bp)         # /api/users/*
    app.register_blueprint(oauth_bp)        # /auth/*

    # Core services
    app.register_blueprint(emotion_bp)      # /api/emotion/*
    app.register_blueprint(aurora_bp)       # /api/aurora/*
    app.register_blueprint(whisper_bp)      # /api/whisper/*

    # Videos
    app.register_blueprint(videos_bp)       # /api/videos/*

    # Face login
    app.register_blueprint(face_bp)         # /api/face/*
    app.register_blueprint(admin_face_bp)   # /api/admin/face/*

    # Uploads
    app.register_blueprint(uploads_bp)      # /api/uploads/*

    # ----------------------------------------------------
    # Health Check
    # ----------------------------------------------------
    @app.route("/")
    def home():
        return jsonify({"message": "Mirror Backend Running"}), 200

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )


""""""""""
# backend/app.py
from dotenv import load_dotenv
load_dotenv()   # MUST BE FIRST

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate

# Ensure imports work when running from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ----------------------------------------------------
# Extensions (SINGLE SOURCE OF TRUTH)
# ----------------------------------------------------
from extensions import db, jwt, limiter

# ----------------------------------------------------
# Models (needed for migrations / Alembic discovery)
# ----------------------------------------------------
from users.models import User, EmotionalProfile
from admin.models import Admin
from videos.models import Video
from face.models import FaceEmbedding
from uploads.routes import uploads_bp

# ----------------------------------------------------
# Face Blueprints
# ----------------------------------------------------
from face.routes import face_bp
from admin.face.routes import admin_face_bp

# ----------------------------------------------------
# Blueprints
# ----------------------------------------------------
# Admin
from admin.routes import admin_bp
from admin.oauth import admin_oauth_bp

# Users
from users.routes import user_bp
from users.oauth import oauth_bp

# Core services
from routes.aurora_routes import aurora_bp
from routes.emotion_routes import emotion_bp
from routes.whisper_routes import whisper_bp

# Videos
from videos import videos_bp

# ----------------------------------------------------
# Migration manager
# ----------------------------------------------------
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # ----------------------------------------------------
    # CORS
    # ----------------------------------------------------
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # ----------------------------------------------------
    # Flask Config
    # ----------------------------------------------------
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
        f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ----------------------------------------------------
    # Init Extensions (INIT ONCE)
    # ----------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # 🔐 INIT GLOBAL RATE LIMITER
    limiter.init_app(app)

    # ----------------------------------------------------
    # Register Blueprints
    # ----------------------------------------------------
    # Admin
    app.register_blueprint(admin_bp)        # /api/admins/*
    app.register_blueprint(admin_oauth_bp)  # /auth/admin/*

    # Users
    app.register_blueprint(user_bp)         # /api/users/*
    app.register_blueprint(oauth_bp)        # /auth/*

    # Core services
    app.register_blueprint(emotion_bp)      # /api/emotion/*
    app.register_blueprint(aurora_bp)       # /api/aurora/*
    app.register_blueprint(whisper_bp)      # /api/whisper/*

    # Videos
    app.register_blueprint(videos_bp)       # /api/videos/*

    # Face login
    app.register_blueprint(face_bp)         # /api/face/*
    app.register_blueprint(admin_face_bp)   # /api/admin/face/*
    
    # /api/uploads
    app.register_blueprint(uploads_bp)      # /api/uploads/*

    # ----------------------------------------------------
    # Health Check
    # ----------------------------------------------------
    @app.route("/")
    def home():
        return jsonify({"message": "Mirror Backend Running"}), 200

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )





"""""""""""