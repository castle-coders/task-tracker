# Task Tracker

A modern, full-stack task management application with support for both human users and AI agents.

## Features

### Core Functionality
- **Task Management**: Create, view, edit, and delete tasks
- **Rich Descriptions**: Markdown-supported task descriptions
- **Task Organization**: 
  - Categories with custom colors
  - Priority levels
  - Status tracking (Todo, In Progress, Done)
  - Due dates
  - User assignments
- **Multiple Views**: 
  - List view with filtering
  - Kanban board with drag-and-drop

### Authentication & Security
- **Email + Password**: Traditional authentication with TOTP 2FA support
- **Passkey Support**: Passwordless authentication using WebAuthn
- **Session-based Auth**: Secure session management with Flask-Login
- **API Key Auth**: Programmatic access for AI agents and integrations

### AI Agent Integration
- **System Users**: Special user accounts for AI agents
- **API Key Authentication**: Secure API access without sessions
- **Agent Skill Package**: Pre-built skill for easy agent integration
- **Full API Access**: Agents can perform all task operations

## Tech Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MySQL (configurable, defaults to SQLite for development)
- **ORM**: SQLAlchemy
- **Authentication**: Flask-Login + WebAuthn (Fido2)
- **API**: RESTful JSON API

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown for rich descriptions
- **HTTP Client**: Axios

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- MySQL (optional, SQLite used by default)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run the application**:
   ```bash
   PYTHONPATH=/path/to/task-tracker FLASK_APP=backend.app:create_app flask run
   ```

   The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### First User Setup

The first user to register automatically becomes an admin with full system privileges, including the ability to create system users for AI agents.

## API Documentation

### Authentication

#### Session-based (Human Users)
```bash
# Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### API Key (AI Agents)
All endpoints that support API key authentication accept the `X-API-Key` header:
```bash
curl -H "X-API-Key: YOUR_API_KEY" http://localhost:5000/api/tasks
```

### Task Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | List all tasks | Session or API Key |
| POST | `/api/tasks` | Create a task | Session or API Key |
| GET | `/api/tasks/:id` | Get task details | Session or API Key |
| PUT | `/api/tasks/:id` | Update a task | Session or API Key |
| DELETE | `/api/tasks/:id` | Delete a task | Session or API Key |

### Reference Data

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List categories | Session or API Key |
| GET | `/api/priorities` | List priorities | Session or API Key |
| GET | `/api/auth/users` | List users | Session or API Key |

### System User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/system` | List system users |
| POST | `/api/users/system` | Create system user |
| PUT | `/api/users/system/:id` | Update system user |
| DELETE | `/api/users/system/:id` | Delete system user |
| POST | `/api/users/system/:id/reset-key` | Reset API key |
| POST | `/api/users/system/:id/enable` | Enable user |
| POST | `/api/users/system/:id/disable` | Disable user |

## Development

### Running Tests
```bash
cd backend
python -m pytest
```

### Project Structure
```
task-tracker/
├── backend/
│   ├── app.py              # Flask application factory
│   ├── models.py           # Database models
│   ├── routes/             # API route handlers
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── tasks.py        # Task CRUD endpoints
│   │   ├── references.py   # Reference data endpoints
│   │   └── users.py        # System user management
│   ├── auth/               # Auth utilities
│   │   └── decorators.py   # Auth decorators
│   ├── schemas.py          # Marshmallow schemas
│   └── tests/              # Test suite
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── api/            # API client
│   │   └── types/          # TypeScript types
│   └── public/
├── .agent/
│   └── skills/
│       └── task-tracker/   # Agent skill package
└── specs/                  # Project specifications
```

## AI Agent Integration

See [AGENTS.md](AGENTS.md) for detailed information on integrating AI agents with the Task Tracker application.

Quick start for agents:
1. Admin creates a system user via `/api/users/system`
2. Agent receives API key (shown only once)
3. Agent uses API key in `X-API-Key` header for all requests
4. Full task management capabilities available

## Environment Variables

### Backend
- `SECRET_KEY`: Flask secret key for session management
- `DATABASE_URL`: Database connection string (default: SQLite)
- `FLASK_ENV`: Environment (`development`, `production`)

### Frontend
- `VITE_API_URL`: Backend API URL (default: `http://localhost:5000`)

## Deployment

### Backend (Production)
1. Set up MySQL database
2. Configure environment variables
3. Run database migrations
4. Use a production WSGI server (e.g., Gunicorn)
5. Configure reverse proxy (e.g., Nginx)

### Frontend (Production)
1. Build the frontend: `npm run build`
2. Serve the `dist` directory with a web server

### Kubernetes
The application is designed for Kubernetes deployment. Ensure health check endpoints are properly configured.

## License

[Your License Here]

## Contributing

[Contributing Guidelines Here]

## Support

For issues and questions, please use the GitHub issue tracker.
