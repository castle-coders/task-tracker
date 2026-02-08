from functools import wraps
from flask import request, jsonify, g
from flask_login import current_user
from backend.models import User
from backend.database import db


def admin_required(f):
    """
    Decorator to ensure the current user is an admin.
    Must be used after @login_required decorator.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentication required'}), 401
        
        if not current_user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
            
        return f(*args, **kwargs)
    return decorated_function


def api_key_or_login_required(f):
    """
    Decorator that accepts either session-based authentication OR API key authentication.
    Checks for X-API-Key header and validates against user api_key_hash.
    Also verifies that the user is_active.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # First check if user is already authenticated via session (flask-login)
        if current_user.is_authenticated:
            # Verify user is active
            if not current_user.is_active:
                return jsonify({'error': 'Account is disabled'}), 401
            return f(*args, **kwargs)
        
        # Check for API key in header
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'Authentication required'}), 401
        
        # Find user with matching API key
        # We need to check all users since keys are hashed
        users = User.query.filter(User.api_key_hash.isnot(None)).all()
        
        authenticated_user = None
        for user in users:
            if user.check_api_key(api_key):
                authenticated_user = user
                break
        
        if not authenticated_user:
            return jsonify({'error': 'Invalid API key'}), 401
        
        # Verify user is active
        if not authenticated_user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401
        
        # Store user in g for this request context
        g.current_user = authenticated_user
        
        return f(*args, **kwargs)
    return decorated_function
