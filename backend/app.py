from flask import Flask, jsonify
from backend.config import Config
from backend.database import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    # Initialize extensions
    db.init_app(app)
    from backend.database import login_manager
    login_manager.init_app(app)

    # Register Blueprints
    from backend.routes.health import health_bp
    from backend.routes.auth import auth_bp
    from backend.routes.tasks import tasks_bp
    from backend.routes.references import references_bp
    from backend.routes.users import users_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(references_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    
    # Import models so they are registered with SQLAlchemy
    from backend import models

    # Create tables for dev (in production use migrations)
    with app.app_context():
        db.create_all()

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error'}), 500

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({'error': 'Not Found'}), 404

    return app

if __name__ == '__main__':
    app = create_app()
    app.run()
