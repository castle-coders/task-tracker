
import pytest
from backend.models import User
from backend.database import db

def test_get_users(client):
    # Register and Login
    client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'password123',
        'name': 'Test User'
    })
    client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })

    # Create an extra user
    user2 = User(name="Alice", email="alice@example.com")
    user2.set_password("password")
    db.session.add(user2)
    db.session.commit()

    response = client.get('/api/auth/users')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) >= 2
    assert any(u['email'] == 'alice@example.com' for u in data)
    assert any(u['name'] == 'Alice' for u in data)
