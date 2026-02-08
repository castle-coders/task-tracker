# Technical Design Document: Task Tracker  
**Reference:** [PRD](prd.md)    

## System Architecture

Note: This software will be deployed to a Kubernetes cluster. Ensure all appropriate health check APIs, etc are implemented.

### Backend

The backend is a Flask application. It is a RESTful API that provides endpoints for creating, reading, updating, and deleting tasks. The backend is built using the Python toolchain.

### Database

The database is a MySQL database that stores tasks and user information. The application should accept configuration to connect to a MySQL database.

### Data Models

The application should have the following data models:

- User
- Task
- Category
- Priority

#### User

- id
- email
- name

Note: include additional fields as needed for authentication and authorization.

#### Task

- id
- title
- description
- due_date
- assignee_id
- priority_id
- category_id
- status

#### Category

- id
- name

#### Priority

- id
- name



