
import pytest
from backend.models import User, Task
from backend.database import db

def test_task_visibility(client):
    # 1. Create User A and User B
    user_a = User(name="Alice", email="alice@test.com")
    user_a.set_password("password")
    user_b = User(name="Bob", email="bob@test.com")
    user_b.set_password("password")
    db.session.add(user_a)
    db.session.add(user_b)
    db.session.commit()

    # 2. User A creates a task (using backend logic directly to avoid login toggle complexities for setup)
    task_a = Task(title="Task A", status="todo", assignee_id=user_a.id)
    db.session.add(task_a)
    db.session.commit()

    # 3. User B logs in
    client.post('/api/auth/login', json={
        'email': 'bob@test.com',
        'password': 'password'
    })

    # 4. User B requests tasks
    response = client.get('/api/tasks')
    assert response.status_code == 200
    data = response.get_json()
    
    # 5. Assert Task A is visible
    assert len(data) >= 1
    titles = [t['title'] for t in data]
    assert "Task A" in titles
