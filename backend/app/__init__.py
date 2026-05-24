from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from .config import Config

db = SQLAlchemy()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    bcrypt.init_app(app)
    # Hanya izinkan request dari domain frontend (vm-frontend / Sumopod)
    # Ganti 'yourdomain.com' dengan domain aktual saat deploy
    CORS(app, origins=[
        "https://yourdomain.com",
        "https://www.yourdomain.com",
    ])

    with app.app_context():
        # Import models so SQLAlchemy knows about them
        from . import models
        
        # Import routes
        from .routes import auth, tracker, blacklist
        
        # Register blueprints
        app.register_blueprint(auth.bp)
        app.register_blueprint(tracker.bp)
        app.register_blueprint(blacklist.bp)

    return app
