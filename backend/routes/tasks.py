from flask import Blueprint, request, jsonify, g
from flask_login import login_required, current_user
from backend.models import Task, db
from backend.schemas import TaskSchema
from backend.auth.decorators import api_key_or_login_required

tasks_bp = Blueprint('tasks', __name__)
task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)

@tasks_bp.route('', methods=['GET'])
@api_key_or_login_required
def get_tasks():
    # Filter by query params if needed (status, priority_id, category_id)
    # Allow viewing all tasks (for team view) or filter by assignee
    query = Task.query
    
    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)
        
    tasks = query.all()
    return jsonify(tasks_schema.dump(tasks)), 200

@tasks_bp.route('', methods=['POST'])
@api_key_or_login_required
def create_task():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No input data provided'}), 400
    
    try:
        # Validate and deserialize input
        # Note: preventing assignee_id override to current_user
        user = getattr(g, 'current_user', current_user)
        data['assignee_id'] = user.id
        task = task_schema.load(data, session=db.session)
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify(task_schema.dump(task)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@tasks_bp.route('/<int:task_id>', methods=['GET'])
@api_key_or_login_required
def get_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    return jsonify(task_schema.dump(task)), 200

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@api_key_or_login_required
def update_task(task_id):
    task = db.session.get(Task, task_id) # Use db.session.get instead of Query.get for SQLAlchemy 2.0 compat
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    data = request.get_json()
    try:
        # Update fields
        # Ideally use schema.load(data, instance=task, partial=True)
        # But for now manual update or simple merge
        # task_schema.load(data, instance=task, partial=True, session=db.session) # marshmallow-sqlalchemy supports this
        
        # Simple manual update for now to avoid complexity with load_instance
        if 'title' in data: task.title = data['title']
        if 'description' in data: task.description = data['description']
        if 'status' in data: task.status = data['status']
        if 'priority_id' in data: task.priority_id = data['priority_id']
        if 'category_id' in data: task.category_id = data['category_id']
        if 'assignee_id' in data: task.assignee_id = data['assignee_id']
        if 'due_date' in data and data['due_date']: 
             from datetime import datetime
             # Handle ISO format from JS (e.g. 2023-10-27T10:00:00.000Z)
             # Python < 3.11 doesn't handle Z nicely with fromisoformat, so replace it
             dt_str = data['due_date'].replace('Z', '+00:00')
             task.due_date = datetime.fromisoformat(dt_str)
        elif 'due_date' in data and data['due_date'] is None:
             task.due_date = None

        db.session.commit()
        return jsonify(task_schema.dump(task)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@api_key_or_login_required
def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
        
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'}), 200
