def test_register_login_logout(client):
    # Register
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'password123',
        'name': 'Test User'
    })
    assert response.status_code == 201
    assert response.json['message'] == 'User registered successfully'

    # Login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    assert response.status_code == 200
    assert 'Logged in successfully' in response.json['message']
    
    # Logout
    response = client.post('/api/auth/logout')
    assert response.status_code == 200
    
    # Verify logout by checking current user (should be unauthorized or return error)
    # The /me endpoint requires login, so it should fail
    response = client.get('/api/auth/me')
    assert response.status_code == 401

def test_login_invalid(client):
    response = client.post('/api/auth/login', json={
        'email': 'wrong@example.com',
        'password': 'wrong'
    })
    assert response.status_code == 401
