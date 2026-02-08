# Development Guide for AI Agents

This document provides instructions for AI agents working on the Task Tracker codebase. It covers architecture, development workflows, coding standards, and best practices.

## Project Overview

Task Tracker is a full-stack task management application with:
- **Backend**: Flask (Python) REST API
- **Frontend**: React (TypeScript) SPA
- **Database**: SQLAlchemy ORM (MySQL/SQLite)
- **Authentication**: Session-based + API key + WebAuthn passkeys

## Architecture

### Backend Structure

```
backend/
├── app.py              # Flask application factory
├── models.py           # SQLAlchemy database models
├── database.py         # Database initialization
├── config.py           # Configuration management
├── auth/
│   └── decorators.py   # Authentication decorators
├── routes/
│   ├── auth.py         # Authentication endpoints
│   ├── tasks.py        # Task CRUD operations
│   ├── references.py   # Categories/priorities endpoints
│   └── users.py        # System user management
├── schemas.py          # Marshmallow schemas (if used)
└── tests/              # Test suite
```

### Frontend Structure

```
frontend/src/
├── main.tsx            # Application entry point
├── App.tsx             # Root component with routing
├── components/
│   ├── TaskModal.tsx   # Task view/edit modal
│   └── ...
├── pages/
│   ├── Dashboard.tsx   # Main task management page
│   ├── Login.tsx       # Authentication page
│   └── Register.tsx    # User registration
├── api/
│   └── client.ts       # Axios API client
└── types/
    └── index.ts        # TypeScript type definitions
```

### Database Models

**User Model**:
- `id`, `email`, `name`, `password_hash`
- `is_admin`: Admin privileges flag
- `is_system_user`: AI agent account flag
- `api_key_hash`: Hashed API key for system users
- `is_active`: Account status
- `totp_secret`: For 2FA (future use)

**Task Model**:
- `id`, `title`, `description`, `status`, `due_date`
- Foreign keys: `assignee_id`, `category_id`, `priority_id`
- Timestamps: `created_at`, `updated_at`

**Reference Models**:
- Category: `id`, `name`, `color`
- Priority: `id`, `name`, `level`

## Development Workflows

### Making Backend Changes

1. **Update Models** (`models.py`):
   - Add/modify SQLAlchemy model fields
   - Include proper relationships and constraints
   - Add helper methods if needed (e.g., `set_password`, `check_api_key`)

2. **Create/Update Routes** (`routes/`):
   - Use appropriate blueprints
   - Apply correct decorators (`@login_required`, `@api_key_or_login_required`, `@admin_required`)
   - Return JSON responses with proper status codes
   - Handle errors gracefully

3. **Update API Client** (frontend `api/client.ts`):
   - Add TypeScript function for new endpoint
   - Include proper type annotations

4. **Update Types** (frontend `types/index.ts`):
   - Add/modify TypeScript interfaces
   - Keep in sync with backend models

5. **Test Changes**:
   - Write unit tests in `backend/tests/`
   - Test API endpoints with curl/Postman
   - Test frontend integration

### Making Frontend Changes

1. **Components** (`components/`):
   - Use functional components with hooks
   - Follow existing patterns for modals, forms, lists
   - Implement proper TypeScript typing
   - Use Tailwind CSS for styling

2. **Pages** (`pages/`):
   - Keep business logic minimal
   - Delegate to components
   - Use context for global state if needed

3. **Styling**:
   - Use Tailwind utility classes
   - Follow dark mode patterns (`dark:` prefix)
   - Maintain consistent spacing and colors

4. **State Management**:
   - Use React hooks (`useState`, `useEffect`)
   - Lift state to parent when needed
   - Consider context for truly global state

## Coding Standards

### Python (Backend)

**Style**:
- Follow PEP 8
- Use 4 spaces for indentation
- Maximum line length: 100 characters
- Use type hints where practical

**Patterns**:
```python
# Route handlers
@blueprint.route('/endpoint', methods=['POST'])
@login_required
@admin_required
def handler():
    data = request.get_json()
    
    # Validate input
    if not data or not data.get('required_field'):
        return jsonify({'error': 'Missing required field'}), 400
    
    # Process
    try:
        # Business logic
        db.session.commit()
        return jsonify({'success': True}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Models
class MyModel(db.Model):
    __tablename__ = 'my_table'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    
    # Include __repr__ for debugging
    def __repr__(self):
        return f'<MyModel {self.name}>'
```

**Authentication Decorators**:
- `@login_required`: Session-based auth only
- `@api_key_or_login_required`: Session OR API key
- `@admin_required`: Requires admin privileges (always use with `@login_required`)

### TypeScript/React (Frontend)

**Style**:
- Use TypeScript strictly (no `any` types)
- Prefer functional components with hooks
- Use 4 spaces for indentation
- Group imports: React, libraries, local

**Patterns**:
```typescript
// Component structure
import React, { useState, useEffect } from 'react';
import type { MyType } from '../types';
import api from '../api/client';

interface MyComponentProps {
    prop1: string;
    onAction: () => void;
}

export default function MyComponent({ prop1, onAction }: MyComponentProps) {
    const [state, setState] = useState<MyType | null>(null);
    
    useEffect(() => {
        fetchData();
    }, []);
    
    const fetchData = async () => {
        try {
            const response = await api.get('/endpoint');
            setState(response.data);
        } catch (error) {
            console.error('Failed to fetch', error);
        }
    };
    
    return (
        <div className="container">
            {/* JSX */}
        </div>
    );
}
```

**Tailwind Patterns**:
- Buttons: `rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700`
- Inputs: `block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-indigo-500 focus:ring-indigo-500`
- Dark mode: Always include `dark:` variants for colors

## Authentication System

### Session-Based (Human Users)
- Uses Flask-Login
- Session cookies managed by Flask
- Current user available via `current_user` proxy

### API Key (System Users)
- API key passed in `X-API-Key` header
- Keys are hashed with bcrypt before storage
- Authenticated user stored in `g.current_user` for request context

### Decorator Usage
```python
# Session only (e.g., admin operations)
@login_required
@admin_required
def admin_only_route():
    pass

# Session OR API key (e.g., task operations)
@api_key_or_login_required
def task_route():
    # Use current_user OR g.current_user
    user = current_user if current_user.is_authenticated else g.current_user
    pass
```

## Database Migrations

### Development

When modifying models during development:

1. **Make Changes** to `models.py`

2. **Delete Old Database** (development only):
   ```bash
   rm instance/tasktracker.db
   ```

3. **Recreate Tables**:
   ```python
   from app import create_app
   from database import db
   app = create_app()
   with app.app_context():
       db.create_all()
   ```

### Production

We use SQL migration files for production deployments:

1. **Create Migration**: Add a new `.sql` file to `backend/migrations/` with format `NNN_description.sql`
   - Use sequential numbering (001, 002, 003, etc.)
   - Include clear comments explaining what the migration does
   - Write idempotent SQL when possible
   - **Database-specific syntax**: Create separate `.mysql.sql` or `.sqlite.sql` files if needed

2. **Apply Migration**: Run the migration against your production database
   - MySQL: `mysql -h HOST -u USER -pPASSWORD DATABASE < migration.sql`
   - Note: Use backticks around reserved keywords (e.g., `` `rank` ``)
   - SQLite uses `REAL` for floats, MySQL uses `FLOAT` or `DOUBLE`

3. **Track Migrations**: Keep a log of applied migrations in your deployment documentation

**Example Migration File** (`002_add_task_rank.sql`):
```sql
-- Add rank column to task table for drag-and-drop ordering (SQLite)
ALTER TABLE task ADD COLUMN rank REAL;
UPDATE task SET rank = id * 1000.0;
```

**MySQL-specific version** (`002_add_task_rank.mysql.sql`):
```sql
-- MySQL version - uses FLOAT and backticks around reserved keyword
ALTER TABLE task ADD COLUMN `rank` FLOAT;
UPDATE task SET `rank` = id * 1000.0;
ALTER TABLE task MODIFY `rank` FLOAT NOT NULL;
```

## Testing

### Backend Tests

Location: `backend/tests/`

```python
import pytest
from app import create_app
from database import db

@pytest.fixture
def client():
    app = create_app({'TESTING': True})
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_endpoint(client):
    response = client.post('/api/endpoint', json={'data': 'value'})
    assert response.status_code == 200
    assert response.json['key'] == 'expected'
```

Run tests:
```bash
cd backend
python -m pytest
```

### Manual API Testing

```bash
# Register first user (becomes admin)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123","name":"Admin"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123"}' \
  -c cookies.txt

# Create system user
curl -X POST http://localhost:5000/api/users/system \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Agent","email":"agent@test.com"}'

# Use API key
curl -H "X-API-Key: YOUR_KEY" http://localhost:5000/api/tasks
```

## Common Tasks

### Adding a New Endpoint

1. Define route in appropriate blueprint file
2. Add authentication decorator
3. Implement request validation
4. Perform business logic
5. Return JSON response with status code
6. Add frontend API client function
7. Update TypeScript types if needed
8. Write tests

### Adding a Model Field

1. Update model in `models.py`
2. Drop and recreate database (dev) or create migration (prod)
3. Update TypeScript interface in `types/index.ts`
4. Update forms/components that display/edit the model
5. Update API serialization if needed

### Adding a Frontend Component

1. Create component file in `components/`
2. Define TypeScript props interface
3. Implement component with proper typing
4. Use Tailwind for styling
5. Import and use in parent component
6. Test in browser

## Debugging

### Backend
- Use `print()` statements or Python debugger
- Check Flask console output
- Review database state with SQLite browser
- Test API endpoints with curl

### Frontend
- Use browser DevTools console
- Check Network tab for API requests
- Use React DevTools
- Add `console.log()` statements

### Common Issues

**401 Unauthorized**:
- Check authentication decorator usage
- Verify API key is being sent correctly
- Check if user is disabled

**CORS Errors**:
- Ensure Flask-CORS is configured
- Check frontend is using correct base URL

**Database Errors**:
- Check model field constraints
- Verify foreign key references exist
- Review SQLAlchemy relationships

## Best Practices

### Security
1. Never commit API keys or secrets
2. Always hash sensitive data (passwords, API keys)
3. Use parameterized queries (SQLAlchemy ORM handles this)
4. Validate all user input
5. Use HTTPS in production

### Code Quality
1. Write self-documenting code with clear variable names
2. Add comments for complex logic
3. Keep functions focused and small
4. Handle errors gracefully
5. Return consistent JSON structure

### API Design
1. Use proper HTTP methods (GET, POST, PUT, DELETE)
2. Return appropriate status codes
3. Include error messages in responses
4. Keep endpoints RESTful
5. Version API if making breaking changes

### Frontend
1. Keep components small and focused
2. Avoid prop drilling (use context if needed)
3. Handle loading and error states
4. Provide user feedback for actions
5. Make UI accessible (ARIA labels, keyboard navigation)

## Project Context

### Key Design Decisions

1. **First User Admin**: The first registered user automatically gets admin privileges
2. **API Key Auth**: System users authenticate with API keys, regular users with sessions
3. **Dual Auth Decorators**: Some endpoints support both session and API key auth
4. **View-First Modal**: Task modal opens in view mode, requires clicking Edit to modify
5. **Markdown Descriptions**: Task descriptions support markdown for rich formatting

### File Locations

- **Specifications**: `/specs/` (PRD, TDD, Agent Skill PRD)
- **Backend Code**: `/backend/`
- **Frontend Code**: `/frontend/src/`
- **Agent Skill**: `/.agent/skills/task-tracker/SKILL.md`
- **Documentation**: `/README.md`, `/AGENTS.md` (this file)

### Environment Setup

**Backend**:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=/path/to/task-tracker FLASK_APP=backend.app:create_app flask run
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Resources

- **Flask Documentation**: https://flask.palletsprojects.com/
- **React Documentation**: https://react.dev/
- **SQLAlchemy ORM**: https://docs.sqlalchemy.org/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs/

## Getting Help

When stuck:
1. Review this guide and project specifications
2. Check existing code for similar patterns
3. Review related test files
4. Search documentation for the specific technology
5. Ask the human developer for clarification on requirements

## Summary

This codebase follows standard patterns:
- RESTful API design on the backend
- Component-based architecture on the frontend
- Clear separation of concerns
- Type safety with TypeScript
- Comprehensive authentication system

Follow the established patterns, maintain code quality, and test thoroughly.
