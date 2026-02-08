from flask import Blueprint, request, jsonify
from flask_login import login_required
from backend.models import Category, Priority, db
from backend.schemas import CategorySchema, PrioritySchema
from backend.auth.decorators import api_key_or_login_required

references_bp = Blueprint('references', __name__)
category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)
priority_schema = PrioritySchema()
priorities_schema = PrioritySchema(many=True)

@references_bp.route('/categories', methods=['GET'])
@api_key_or_login_required
def get_categories():
    categories = Category.query.all()
    return jsonify(categories_schema.dump(categories)), 200

@references_bp.route('/categories', methods=['POST'])
@login_required
def create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Missing name'}), 400
        
    if Category.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Category already exists'}), 400
        
    category = Category(name=data['name'], color=data.get('color', '#6366f1'))
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category_schema.dump(category)), 201

@references_bp.route('/priorities', methods=['GET'])
@api_key_or_login_required
def get_priorities():
    priorities = Priority.query.order_by(Priority.level.desc()).all()
    return jsonify(priorities_schema.dump(priorities)), 200

@references_bp.route('/priorities', methods=['POST'])
@login_required
def create_priority():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Missing name'}), 400
        
    if Priority.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Priority already exists'}), 400
        
    priority = Priority(name=data['name'], level=data.get('level', 0))
    db.session.add(priority)
    db.session.commit()
    
    return jsonify(priority_schema.dump(priority)), 201

@references_bp.route('/categories/<int:id>', methods=['DELETE'])
@login_required
def delete_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
        
    # Optional: Check if used by tasks? For now, we'll allow deletion (tasks might have null category or foreign key constraint error)
    # The simplest approach for now is to allow it and let the database handle constraints if mapped.
    # Given the models, we should probably check.
    # But for MVP configuration, we will try to delete.
    
    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Category deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Cannot delete category (likely in use)'}), 400

@references_bp.route('/priorities/<int:id>', methods=['DELETE'])
@login_required
def delete_priority(id):
    priority = Priority.query.get(id)
    if not priority:
        return jsonify({'error': 'Priority not found'}), 404
        
    try:
        db.session.delete(priority)
        db.session.commit()
        return jsonify({'message': 'Priority deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Cannot delete priority (likely in use)'}), 400
