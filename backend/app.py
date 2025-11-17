# backend/app.py

# backend/app.py

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

# Ensure imports work when running from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Extensions
from extensions import db, jwt

# Models (needed for migrations)
from users.models import User, EmotionalProfile, FaceEmbedding

# Blueprints
from users.routes import user_bp
from users.oauth import oauth_bp   # <-- NEW: OAuth routes

# Migration manager
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False

    # ----------------------------------------------------
    # CORS
    # ----------------------------------------------------
    ALLOWED_ORIGINS = [
        os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    CORS(
        app,
        resources={r"/*": {"origins": ALLOWED_ORIGINS}},
        supports_credentials=True,
        expose_headers=["Content-Type", "Authorization"]
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
    # Init Extensions
    # ----------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # ----------------------------------------------------
    # Register Blueprints
    # ----------------------------------------------------
    app.register_blueprint(user_bp)     # /api/users/....
    app.register_blueprint(oauth_bp)    # /auth/google/... and /auth/facebook/...

    # ----------------------------------------------------
    # Health Check
    # ----------------------------------------------------
    @app.route("/")
    def home():
        return jsonify({"message": "Mirror Backend Running"}), 200

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(debug=True, host="0.0.0.0", port=5000)



""""""""""

# backend/app.py

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv

# Make sure Python finds local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Extensions (DB + JWT)
from extensions import db, jwt

# Import models so Alembic can see them
from users.models import User

# Blueprints
from users.routes import user_bp

# Migration manager
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False  # Accept /api/users and /api/users/

    # ----------------------------------------------------
    # CORS (keep full config)
    # ----------------------------------------------------
    ALLOWED_ORIGINS = [
        os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    CORS(
        app,
        resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
        supports_credentials=True,
        expose_headers=["Content-Type", "Authorization"],
    )

    # ----------------------------------------------------
    # Flask Config
    # ----------------------------------------------------
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")

    # JWT (flask-jwt-extended)
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret")

    # Database
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"postgresql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@"
        f"{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
    )

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ----------------------------------------------------
    # Initialize Extensions
    # ----------------------------------------------------
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # ----------------------------------------------------
    # Register API Blueprints
    # ----------------------------------------------------
    app.register_blueprint(user_bp)

    # ----------------------------------------------------
    # Health Check
    # ----------------------------------------------------
    @app.route("/")
    def home():
        return jsonify({"message": "Mirror Backend Running"}), 200

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(debug=True, host="0.0.0.0", port=5000)


"""""""""""