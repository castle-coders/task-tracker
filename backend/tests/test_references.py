import pytest

def test_categories_priorities(client):
    # Register and login
    client.post('/api/auth/register', json={'email': 'ref@example.com', 'password': 'password', 'name': 'Ref User'})
    client.post('/api/auth/login', json={'email': 'ref@example.com', 'password': 'password'})

    # Categories
    response = client.post('/api/categories', json={'name': 'Work'})
    assert response.status_code == 201
    assert response.json['name'] == 'Work'

    response = client.get('/api/categories')
    assert response.status_code == 200
    assert len(response.json) >= 1

    # Priorities
    response = client.post('/api/priorities', json={'name': 'High', 'level': 10})
    assert response.status_code == 201
    assert response.json['name'] == 'High'

    response = client.get('/api/priorities')
    assert response.status_code == 200
    assert len(response.json) >= 1
