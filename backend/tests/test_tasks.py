import pytest
from backend.models import Task, User, db

def test_create_task(client):
    # Register and login
    client.post('/api/auth/register', json={'email': 'task@example.com', 'password': 'password', 'name': 'Task User'})
    client.post('/api/auth/login', json={'email': 'task@example.com', 'password': 'password'})

    response = client.post('/api/tasks', json={
        'title': 'New Task',
        'description': 'Do something',
        'status': 'todo'
    })
    assert response.status_code == 201
    assert response.json['title'] == 'New Task'

def test_get_tasks(client):
    # Register and login
    client.post('/api/auth/register', json={'email': 'task2@example.com', 'password': 'password', 'name': 'Task User 2'})
    client.post('/api/auth/login', json={'email': 'task2@example.com', 'password': 'password'})

    client.post('/api/tasks', json={'title': 'Task 1', 'status': 'todo'})
    client.post('/api/tasks', json={'title': 'Task 2', 'status': 'in_progress'})

    response = client.get('/api/tasks')
    assert response.status_code == 200
    assert len(response.json) == 2

    # Filter
    response = client.get('/api/tasks?status=todo')
    assert response.status_code == 200
    assert len(response.json) == 1
    assert response.json[0]['title'] == 'Task 1'

def test_update_delete_task(client):
    # Register and login
    client.post('/api/auth/register', json={'email': 'task3@example.com', 'password': 'password', 'name': 'Task User 3'})
    client.post('/api/auth/login', json={'email': 'task3@example.com', 'password': 'password'})

    create_res = client.post('/api/tasks', json={'title': 'Task To Update', 'status': 'todo'})
    task_id = create_res.json['id']

    # Update
    response = client.put(f'/api/tasks/{task_id}', json={'title': 'Updated Title', 'status': 'done'})
    assert response.status_code == 200
    assert response.json['title'] == 'Updated Title'
    assert response.json['status'] == 'done'

    # Delete
    response = client.delete(f'/api/tasks/{task_id}')
    assert response.status_code == 200

    # Verify deleted
    response = client.get(f'/api/tasks/{task_id}')
    assert response.status_code == 404
