---
name: Task Tracker Integration
description: Interact with a Task Tracker application to manage tasks programmatically
version: 1.0.0
---

# Task Tracker Skill

This skill enables AI agents to interact with a Task Tracker application via its REST API. You can create, read, update, and delete tasks, as well as query reference data like categories and priorities.

## Prerequisites

### API Key Setup

1. **Admin Access Required**: An admin user must create a system user for the agent
2. **Get API Key**: The admin will provide you with an API key when creating the system user
3. **Store Securely**: Save the API key - it will only be shown once

To create a system user (admin only):
```bash
curl -X POST http://localhost:5000/api/users/system \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_ADMIN_SESSION" \
  -d '{
    "name": "AI Agent",
    "email": "agent@example.com"
  }'
```

The response will include an `api_key` field. Save this value.

## Authentication

All API requests must include the API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: YOUR_API_KEY_HERE" http://localhost:5000/api/tasks
```

## Base URL

Replace `http://localhost:5000` with the actual deployment URL of the Task Tracker application.

## Available Operations

### 1. List Tasks

**Endpoint**: `GET /api/tasks`

**Query Parameters**:
- `status` (optional): Filter by status (`todo`, `in_progress`, `done`)
- `due_within_days` (optional): Filter tasks by due date within N days
  - **Includes all overdue tasks** (due_date < today)
  - **Includes tasks due within N days** (due_date <= today + N)
  - **Excludes tasks with no due date** (due_date is NULL)
  - Common values:
    - `7`: Tasks due this week (+ overdue)
    - `14`: Tasks due in 2 weeks (+ overdue)
    - `30`: Tasks due in 30 days (+ overdue)

**Examples**:
```bash
# Get all todo tasks
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:5000/api/tasks?status=todo"

# Get all tasks due within the next 7 days (including overdue)
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:5000/api/tasks?due_within_days=7"

# Get todo tasks due within 30 days
curl -H "X-API-Key: YOUR_API_KEY" \
  "http://localhost:5000/api/tasks?status=todo&due_within_days=30"
```

**Response**:
```json
[
  {
    "id": 1,
    "title": "Implement feature X",
    "description": "Add new functionality...",
    "status": "todo",
    "priority_id": 2,
    "category_id": 1,
    "assignee_id": 5,
    "due_date": "2026-02-15T00:00:00",
    "created_at": "2026-02-01T10:00:00",
    "updated_at": "2026-02-01T10:00:00"
  }
]
```

### 2. Create Task

**Endpoint**: `POST /api/tasks`

**Required Fields**:
- `title`: Task title (string)
- `description`: Task description (string, optional)
- `priority_id`: Priority ID (integer)
- `category_id`: Category ID (integer, optional)
- `status`: Task status (`todo`, `in_progress`, `done`)
- `due_date`: Due date in ISO format (string, optional)

**Example**:
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "status": "todo",
    "priority_id": 1,
    "category_id": 2,
    "due_date": "2026-02-20T00:00:00"
  }'
```

**Response**:
```json
{
  "id": 42,
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "priority_id": 1,
  "category_id": 2,
  "assignee_id": 5,
  "due_date": "2026-02-20T00:00:00",
  "created_at": "2026-02-07T17:45:00",
  "updated_at": "2026-02-07T17:45:00"
}
```

### 3. Get Task Details

**Endpoint**: `GET /api/tasks/:id`

**Example**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:5000/api/tasks/42
```

### 4. Update Task

**Endpoint**: `PUT /api/tasks/:id`

**Allowed Fields** (all optional):
- `title`: Task title
- `description`: Task description
- `status`: Task status
- `priority_id`: Priority ID
- `category_id`: Category ID
- `assignee_id`: Assignee user ID
- `due_date`: Due date in ISO format

**Example**:
```bash
curl -X PUT http://localhost:5000/api/tasks/42 \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

### 5. Delete Task

**Endpoint**: `DELETE /api/tasks/:id`

**Example**:
```bash
curl -X DELETE http://localhost:5000/api/tasks/42 \
  -H "X-API-Key: YOUR_API_KEY"
```

**Response**:
```json
{
  "message": "Task deleted"
}
```

### 6. Get Categories

**Endpoint**: `GET /api/categories`

Retrieve all available task categories.

**Example**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:5000/api/categories
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "Development",
    "color": "#6366f1"
  },
  {
    "id": 2,
    "name": "Bug Fix",
    "color": "#ef4444"
  }
]
```

### 7. Get Priorities

**Endpoint**: `GET /api/priorities`

Retrieve all available task priorities (ordered by level, descending).

**Example**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:5000/api/priorities
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "High",
    "level": 3
  },
  {
    "id": 2,
    "name": "Medium",
    "level": 2
  },
  {
    "id": 3,
    "name": "Low",
    "level": 1
  }
]
```

### 8. Get Users

**Endpoint**: `GET /api/auth/users`

Retrieve all users in the system (for assigning tasks).

**Example**:
```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  http://localhost:5000/api/auth/users
```

**Response**:
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com"
  }
]
```

## Common Workflows

### Creating a Task with References

1. First, get available categories and priorities:
   ```bash
   curl -H "X-API-Key: KEY" http://localhost:5000/api/categories
   curl -H "X-API-Key: KEY" http://localhost:5000/api/priorities
   ```

2. Then create the task using the appropriate IDs:
   ```bash
   curl -X POST http://localhost:5000/api/tasks \
     -H "X-API-Key: KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Fix login bug",
       "description": "Users cannot login with 2FA",
       "status": "todo",
       "priority_id": 1,
       "category_id": 2
     }'
   ```

### Updating Task Status

To move a task through the workflow:

```bash
# Start working on a task
curl -X PUT http://localhost:5000/api/tasks/42 \
  -H "X-API-Key: KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

# Mark as complete
curl -X PUT http://localhost:5000/api/tasks/42 \
  -H "X-API-Key: KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "done"}'
```

### Filtering Tasks by Due Date

Get tasks that need attention soon:

```bash
# Get all tasks due this week (7 days + overdue)
curl -H "X-API-Key: KEY" \
  "http://localhost:5000/api/tasks?due_within_days=7"

# Get high-priority tasks due in the next 2 weeks
# (requires multiple API calls - filter by due date, then filter results by priority)
curl -H "X-API-Key: KEY" \
  "http://localhost:5000/api/tasks?due_within_days=14"

# Get todo tasks due in the next 30 days
curl -H "X-API-Key: KEY" \
  "http://localhost:5000/api/tasks?status=todo&due_within_days=30"
```

## Error Handling

### Common Error Responses

**401 Unauthorized**: Invalid or missing API key
```json
{
  "error": "Authentication required"
}
```

**401 Unauthorized**: Disabled account
```json
{
  "error": "Account is disabled"
}
```

**403 Forbidden**: Insufficient permissions
```json
{
  "error": "Admin access required"
}
```

**404 Not Found**: Resource doesn't exist
```json
{
  "error": "Task not found"
}
```

**400 Bad Request**: Invalid input data
```json
{
  "error": "Missing required fields"
}
```

### Troubleshooting

- **API key not working**: Verify the key is correct and the system user is active (not disabled)
- **Cannot create tasks**: Ensure all required fields are provided (title, status, priority_id)
- **Cannot find categories/priorities**: The application may not have them seeded - contact an admin
- **403 errors**: System users cannot access admin-only endpoints (like creating other users)

## Notes

- All timestamps are in ISO 8601 format
- System users have the same task management permissions as regular users
- System users cannot access admin endpoints (user management)
- The `assignee_id` is automatically set to the authenticated user when creating tasks
- Tasks can be reassigned by updating the `assignee_id` field
