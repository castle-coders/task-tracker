import secrets
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from backend.models import User, db
from backend.auth.decorators import admin_required
from werkzeug.security import generate_password_hash

users_bp = Blueprint('users', __name__)


@users_bp.route('/system', methods=['GET'])
@login_required
@admin_required
def get_system_users():
    """List all system users (admin only)"""
    system_users = User.query.filter_by(is_system_user=True).all()
    
    return jsonify([{
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'is_active': user.is_active,
        'created_at': user.created_at.isoformat() if user.created_at else None
    } for user in system_users]), 200


@users_bp.route('/system', methods=['POST'])
@login_required
@admin_required
def create_system_user():
    """Create a new system user (admin only)"""
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('name'):
        return jsonify({'error': 'Missing required fields: email, name'}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Generate API key
    api_key = secrets.token_urlsafe(32)
    
    # Create system user
    user = User(
        name=data['name'],
        email=data['email'],
        is_system_user=True,
        is_active=True,
        is_admin=False
    )
    user.set_api_key(api_key)
    
    db.session.add(user)
    db.session.commit()
    
    # Return the API key (only shown once)
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'is_active': user.is_active,
        'api_key': api_key,  # Only returned on creation
        'message': 'System user created successfully. Save the API key - it will not be shown again.'
    }), 201


@users_bp.route('/system/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_system_user(user_id):
    """Update system user details (admin only)"""
    user = db.session.get(User, user_id)
    
    if not user or not user.is_system_user:
        return jsonify({'error': 'System user not found'}), 404
    
    data = request.get_json()
    
    # Update name and email
    if 'name' in data:
        user.name = data['name']
    
    if 'email' in data:
        # Check if email is already taken by another user
        existing = User.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'is_active': user.is_active,
        'message': 'System user updated successfully'
    }), 200


@users_bp.route('/system/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_system_user(user_id):
    """Delete a system user (admin only)"""
    user = db.session.get(User, user_id)
    
    if not user or not user.is_system_user:
        return jsonify({'error': 'System user not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'System user deleted successfully'}), 200


@users_bp.route('/system/<int:user_id>/reset-key', methods=['POST'])
@login_required
@admin_required
def reset_api_key(user_id):
    """Reset API key for a system user (admin only)"""
    user = db.session.get(User, user_id)
    
    if not user or not user.is_system_user:
        return jsonify({'error': 'System user not found'}), 404
    
    # Generate new API key
    api_key = secrets.token_urlsafe(32)
    user.set_api_key(api_key)
    
    db.session.commit()
    
    # Return the new API key (only shown once)
    return jsonify({
        'api_key': api_key,
        'message': 'API key reset successfully. Save the new API key - it will not be shown again.'
    }), 200


@users_bp.route('/system/<int:user_id>/enable', methods=['POST'])
@login_required
@admin_required
def enable_system_user(user_id):
    """Enable a system user (admin only)"""
    user = db.session.get(User, user_id)
    
    if not user or not user.is_system_user:
        return jsonify({'error': 'System user not found'}), 404
    
    user.is_active = True
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'is_active': user.is_active,
        'message': 'System user enabled successfully'
    }), 200


@users_bp.route('/system/<int:user_id>/disable', methods=['POST'])
@login_required
@admin_required
def disable_system_user(user_id):
    """Disable a system user (admin only)"""
    user = db.session.get(User, user_id)
    
    if not user or not user.is_system_user:
        return jsonify({'error': 'System user not found'}), 404
    
    user.is_active = False
    db.session.commit()
    
    return jsonify({
        'id': user.id,
        'is_active': user.is_active,
        'message': 'System user disabled successfully'
    }), 200
