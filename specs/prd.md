Project Name: Task Tracker

## Project Overview

Task Tracker is a web application that allows users to create and manage tasks. It provides a simple and intuitive interface for users to add, edit, and delete tasks, as well as mark tasks as completed.

## Project Objectives

- Create a web application that allows users to create and manage tasks.

## User Stories & Acceptance Criteria

### User Story: Login

As a user, I want to login so that I can access my tasks.

Acceptance Criteria:

- The user should be able to login using their email and password + TOTP.
- The user should be able to login using their passkey.

### User Story: Register

As a user, I want to register so that I can create an account.

Acceptance Criteria:

- The user should be able to register using their email and password + TOTP.
- The user should be able to register using their passkey.

### User Story: Create Task

As a user, I want to create a task so that I can manage my tasks.

Acceptance Criteria:

- The task should have a title and description.
- The task should have a due date.
- The task should have an assignee.
- The task should have a priority level.
- The task should have a status (todo, in progress, done).
- The task should have a category.

### User Story: Edit Task

As a user, I want to edit a task so that I can update my tasks.

Acceptance Criteria:

- The task should have a title and description.
- The task should have a due date.
- The task should have an assignee. 
- The task should have a priority level.
- The task should have a status (todo, in progress, done).
- The task should have a category.

### User Story: Delete Task

As a user, I want to delete a task so that I can remove my tasks.

Acceptance Criteria:

- The task should be removed from the database.
- The task should be removed from the user interface.

### User Story: Mark Task as Done

As a user, I want to mark a task as done so that I can track my progress.

Acceptance Criteria:

- The status of the task should be updated to "done" in the database.
- The status of the task should be updated to "done" in the user interface.

### User Story: Mark Task as In Progress

As a user, I want to mark a task as "in progress" so that I can track my progress.

Acceptance Criteria:

- The status of the task should be updated to "in progress" in the database.
- The status of the task should be updated to "in progress" in the user interface.    

### User Story: Kanban View

As a user, I want to view my tasks in a kanban board so that I can better manage my tasks.

Acceptance Criteria:

- The tasks should be displayed in a kanban board.
- The tasks can be filtered by status.
- The tasks can be filtered by priority.
- The tasks can be filtered by category.
- Clicking on a task should open a modal with the task details. The modal should allow editing of the task.

### User Story: List View

As a user, I want to view my tasks in a list so that I can better manage my tasks.

Acceptance Criteria:

- The tasks should be displayed in a list.
- The tasks can be filtered by status.
- The tasks can be filtered by priority.
- The tasks can be filtered by category.
- Clicking on a task should open a modal with the task details. The modal should allow editing of the task.

## Functional Requirements

- Data Persistence: The application should persist data in a mysql database.
- Authentication: Is required to access the application. (exempt: Login, Register, Logout)
- Authorization: Is required to access the application. (exempt: Login, Register, Logout)

## UI/UX Guidelines (Optional / If applicable)
> **Instruction to Agent:** If no design file is provided, use these principles.

* **Theme:** Support Dark and Light mode
* **Responsiveness:** Mobile-first

