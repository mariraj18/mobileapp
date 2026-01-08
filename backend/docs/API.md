# Task Management System API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All endpoints except registration and login require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "is_active": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

### Get Current User
```http
GET /auth/me
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "is_active": true
  }
}
```

---

## Workspace Endpoints

### Create Workspace
```http
POST /workspaces
```

**Request Body:**
```json
{
  "name": "My Workspace"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Workspace created successfully",
  "data": {
    "id": "uuid",
    "name": "My Workspace",
    "created_by": "uuid",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Workspaces
```http
GET /workspaces?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Workspace",
      "created_by": "uuid",
      "role": "OWNER",
      "joined_at": "2024-01-01T00:00:00.000Z",
      "creator": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

### Get Workspace by ID
```http
GET /workspaces/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Workspace",
    "created_by": "uuid",
    "memberCount": 5,
    "userRole": "OWNER",
    "creator": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "projects": [
      {
        "id": "uuid",
        "name": "Project 1",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Update Workspace
```http
PUT /workspaces/:id
```

**Request Body:**
```json
{
  "name": "Updated Workspace Name"
}
```

### Delete Workspace
```http
DELETE /workspaces/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Workspace deleted successfully"
}
```

### Get Workspace Members
```http
GET /workspaces/:id/members
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "OWNER",
      "joined_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Add Workspace Member
```http
POST /workspaces/:id/members
```

**Request Body:**
```json
{
  "userId": "uuid",
  "role": "MEMBER"
}
```

### Update Member Role
```http
PUT /workspaces/:id/members/:userId
```

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

### Remove Member
```http
DELETE /workspaces/:id/members/:userId
```

---

## Project Endpoints

### Create Project
```http
POST /projects/workspace/:workspaceId
```

**Request Body:**
```json
{
  "name": "New Project"
}
```

### Get All Projects in Workspace
```http
GET /projects/workspace/:workspaceId?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project 1",
      "workspace_id": "uuid",
      "created_by": "uuid",
      "taskCount": 10,
      "creator": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Get Project by ID
```http
GET /projects/:id
```

### Update Project
```http
PUT /projects/:id
```

**Request Body:**
```json
{
  "name": "Updated Project Name"
}
```

### Delete Project
```http
DELETE /projects/:id
```

---

## Task Endpoints

### Create Task
```http
POST /tasks/project/:projectId
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "TODO",
  "priority": "HIGH",
  "due_date": "2024-12-31T23:59:59.000Z",
  "assignedUserIds": ["uuid1", "uuid2"]
}
```

### Get All Tasks in Project
```http
GET /tasks/project/:projectId?page=1&limit=20&status=TODO&priority=HIGH&search=query&sortBy=created_at&sortOrder=DESC
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (TODO, IN_PROGRESS, DONE)
- `priority` (string): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `assignedTo` (uuid): Filter by assigned user
- `search` (string): Search in title and description
- `sortBy` (string): Sort field (created_at, updated_at, due_date, priority, title)
- `sortOrder` (string): Sort order (ASC, DESC)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Task Title",
      "description": "Task description",
      "status": "TODO",
      "priority": "HIGH",
      "due_date": "2024-12-31T23:59:59.000Z",
      "project_id": "uuid",
      "created_by": "uuid",
      "creator": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assignedUsers": [
        {
          "id": "uuid",
          "name": "Jane Doe",
          "email": "jane@example.com"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### Get Task by ID
```http
GET /tasks/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Task Title",
    "description": "Task description",
    "status": "TODO",
    "priority": "HIGH",
    "due_date": "2024-12-31T23:59:59.000Z",
    "project_id": "uuid",
    "created_by": "uuid",
    "commentCount": 5,
    "attachmentCount": 2,
    "creator": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "assignedUsers": [
      {
        "id": "uuid",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "TaskAssignment": {
          "assigned_at": "2024-01-01T00:00:00.000Z"
        }
      }
    ],
    "project": {
      "id": "uuid",
      "name": "Project Name",
      "workspace_id": "uuid"
    }
  }
}
```

### Update Task
```http
PUT /tasks/:id
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "due_date": "2024-12-31T23:59:59.000Z"
}
```

### Delete Task
```http
DELETE /tasks/:id
```

### Assign Users to Task
```http
POST /tasks/:id/assign
```

**Request Body:**
```json
{
  "userIds": ["uuid1", "uuid2"]
}
```

### Unassign Users from Task
```http
POST /tasks/:id/unassign
```

**Request Body:**
```json
{
  "userIds": ["uuid1", "uuid2"]
}
```

---

## Comment Endpoints

### Create Comment
```http
POST /comments/task/:taskId
```

**Request Body:**
```json
{
  "content": "This is a comment"
}
```

### Get All Comments for Task
```http
GET /comments/task/:taskId?page=1&limit=20
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "user_id": "uuid",
      "content": "This is a comment",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### Update Comment
```http
PUT /comments/:id
```

**Request Body:**
```json
{
  "content": "Updated comment"
}
```

**Note:** Comments can only be edited within 5 minutes of creation by the author.

### Delete Comment
```http
DELETE /comments/:id
```

**Note:** Comments can only be deleted within 5 minutes of creation by the author.

---

## Attachment Endpoints

### Upload Attachment
```http
POST /attachments/task/:taskId
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: File to upload (max 10MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "data": {
    "id": "uuid",
    "original_filename": "document.pdf",
    "file_size": 1024000,
    "file_type": "application/pdf",
    "uploaded_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get All Attachments for Task
```http
GET /attachments/task/:taskId
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "original_filename": "document.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "uploaded_by": "uuid",
      "uploaded_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Download Attachment
```http
GET /attachments/:id/download
```

**Response:** File download

### Delete Attachment
```http
DELETE /attachments/:id
```

---

## Notification Endpoints

### Get Notifications
```http
GET /notifications?page=1&limit=20&unreadOnly=false&type=DUE_DATE
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `unreadOnly` (boolean): Show only unread notifications (default: false)
- `type` (string): Filter by type (DUE_DATE, PRIORITY, ASSIGNMENT, COMMENT)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "task_id": "uuid",
      "type": "DUE_DATE",
      "message": "Task \"Task Title\" is due within 24 hours",
      "is_read": false,
      "created_at": "2024-01-01T00:00:00.000Z",
      "task": {
        "id": "uuid",
        "title": "Task Title",
        "status": "TODO"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10
  }
}
```

### Get Unread Count
```http
GET /notifications/unread-count
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### Mark Notification as Read
```http
PUT /notifications/:id/read
```

### Mark All Notifications as Read
```http
PUT /notifications/read-all
```

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 5
  }
}
```

### Delete Notification
```http
DELETE /notifications/:id
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access",
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Roles and Permissions

### Role Hierarchy
1. **OWNER** - Full control over workspace
2. **ADMIN** - Most permissions except deleting workspace
3. **MEMBER** - Basic access and task management

### Permission Matrix

| Action | OWNER | ADMIN | MEMBER |
|--------|-------|-------|--------|
| Create Workspace | ✓ | ✓ | ✓ |
| Update Workspace | ✓ | ✗ | ✗ |
| Delete Workspace | ✓ | ✗ | ✗ |
| Add Members | ✓ | ✓ | ✗ |
| Remove Members | ✓ | ✓ | ✗ |
| Update Roles | ✓ | ✓ | ✗ |
| Create Project | ✓ | ✓ | ✗ |
| Update Project | ✓ | ✓ | ✗ |
| Delete Project | ✓ | ✓ | ✗ |
| Create Task | ✓ | ✓ | ✓ |
| Update Task | ✓ | ✓ | ✓ |
| Delete Task | ✓ | ✓ | ✗ |
| Assign Tasks | ✓ | ✓ | ✗ |
| Comment on Task | ✓ | ✓ | ✓ |
| Upload Attachment | ✓ | ✓ | ✓ |

---

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per window
- Applies to all endpoints

**Response (429):**
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```
