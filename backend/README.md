# Task Management System - Backend

A production-grade distributed task management system API similar to ClickUp, built with Node.js, Express, and PostgreSQL.

## Features

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Workspace and project management
- Task management with assignments
- Comments and file attachments
- Real-time notifications
- Due date and priority alerts
- Comprehensive API with validation
- File upload support
- Pagination and filtering
- Production-ready error handling

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+
- **ORM**: Sequelize
- **Authentication**: JWT with Passport.js
- **Validation**: Joi
- **File Upload**: Multer
- **Logging**: Winston
- **Cron Jobs**: node-cron
- **Security**: Helmet, bcrypt

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- PostgreSQL 12 or higher
- Git (optional)

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_management
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:19000,http://localhost:19001

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Notification Configuration
NOTIFICATION_CHECK_INTERVAL=*/30 * * * *
DUE_DATE_WARNING_HOURS=24

# Logging
LOG_LEVEL=info
```

### 4. Database Setup

#### Option A: Using Sequelize CLI (Recommended)

```bash
# Create database
npx sequelize-cli db:create

# Run migrations
npx sequelize-cli db:migrate

# Seed database (optional)
npx sequelize-cli db:seed:all
```

#### Option B: Using PostgreSQL directly

```bash
# Create database
createdb task_management

# Or using psql
psql -U postgres
CREATE DATABASE task_management;
\q
```

### 5. Create Required Directories

```bash
mkdir -p logs uploads
```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Documentation

Comprehensive API documentation is available in [docs/API.md](./docs/API.md)

**Quick Start:**

1. Register a user:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

2. Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

3. Use the returned token for authenticated requests:
```bash
curl -X GET http://localhost:5000/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
backend/
├── config/                 # Configuration files
│   ├── database.js        # Database configuration
│   ├── passport.js        # Passport JWT strategy
│   └── constants.js       # Application constants
├── src/
│   ├── models/            # Sequelize models
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Workspace.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── ...
│   ├── controllers/       # Request handlers
│   │   ├── authController.js
│   │   ├── workspaceController.js
│   │   ├── taskController.js
│   │   └── ...
│   ├── routes/            # API routes
│   │   ├── authRoutes.js
│   │   ├── workspaceRoutes.js
│   │   └── ...
│   ├── middleware/        # Custom middleware
│   │   ├── auth.js
│   │   ├── permissions.js
│   │   ├── validation.js
│   │   └── errorHandler.js
│   └── utils/             # Utility functions
│       ├── helpers.js
│       ├── validators.js
│       ├── fileUpload.js
│       ├── cronJobs.js
│       └── logger.js
├── uploads/               # File upload directory
├── logs/                  # Log files
├── tests/                 # Test files
├── docs/                  # Documentation
├── server.js             # Application entry point
├── package.json
└── .env.example
```

## Database Schema

### Core Tables

- **users**: User accounts
- **workspaces**: Team workspaces
- **workspace_members**: User-workspace relationships with roles
- **projects**: Projects within workspaces
- **tasks**: Task items
- **task_assignments**: User-task assignments
- **task_comments**: Task comments
- **task_attachments**: File attachments
- **notifications**: User notifications

### Relationships

- Workspace has many Projects
- Project has many Tasks
- Task has many Comments
- Task has many Attachments
- Task can be assigned to many Users
- User can be member of many Workspaces with different roles

## Authentication & Authorization

### JWT Authentication

- Access tokens expire in 15 minutes (configurable)
- Refresh tokens expire in 7 days (configurable)
- Tokens are signed with HS256 algorithm
- Passwords are hashed with bcrypt (10 rounds)

### RBAC (Role-Based Access Control)

**Roles:**
- **OWNER**: Full control over workspace
- **ADMIN**: Can manage projects, tasks, and members
- **MEMBER**: Can create and update tasks, add comments

**Enforcement:**
- All permissions checked server-side
- Middleware validates workspace membership
- Role-specific operations enforced per endpoint

## File Uploads

- Max file size: 10MB (configurable)
- Allowed types: Images, PDFs, Office documents, text files
- Files stored in `uploads/` directory
- Metadata stored in database
- Protected download routes require authentication

## Notifications

### Automated Notifications

Cron jobs run every 30 minutes (configurable) to check:
- Tasks due within 24 hours
- Overdue tasks
- High-priority tasks

### Notification Types

- `DUE_DATE`: Task deadline approaching or overdue
- `PRIORITY`: High-priority task alerts
- `ASSIGNMENT`: User assigned to task
- `COMMENT`: New comment on task

## Logging

Logs are written to:
- Console (all environments)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

Log levels: error, warn, info, http, debug

## Security Best Practices

✅ Implemented:
- JWT authentication with short-lived tokens
- Password hashing with bcrypt
- SQL injection prevention (Sequelize ORM)
- XSS prevention (input validation)
- CORS configuration
- Helmet security headers
- Rate limiting
- Input validation with Joi
- File type validation
- File size limits

## Deployment

### Using Docker

```bash
# Build image
docker build -t task-management-backend .

# Run container
docker run -p 5000:5000 --env-file .env task-management-backend
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name task-management

# View logs
pm2 logs task-management

# Restart
pm2 restart task-management

# Stop
pm2 stop task-management
```

### Environment Variables for Production

Ensure these are set in production:

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<different-strong-random-secret>
DB_HOST=<production-db-host>
DB_PASSWORD=<strong-db-password>
CORS_ORIGIN=<production-frontend-url>
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U postgres -h localhost

# Check database exists
psql -U postgres -l
```

### Port Already in Use

```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Migration Issues

```bash
# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Re-run migrations
npx sequelize-cli db:migrate
```

## Development

### Code Style

- Use ES6+ features
- Follow Airbnb JavaScript style guide
- Use async/await for asynchronous operations
- Implement proper error handling
- Add comments for complex logic

### Adding New Endpoints

1. Create model (if needed) in `src/models/`
2. Create controller in `src/controllers/`
3. Create route in `src/routes/`
4. Add validation schema in `src/utils/validators.js`
5. Add middleware if needed
6. Update API documentation
7. Write tests

## Performance Optimization

- Database indexes on frequently queried columns
- Connection pooling configured
- Pagination for list endpoints
- Efficient query using Sequelize includes
- File upload size limits
- Rate limiting to prevent abuse

## Monitoring

Recommended tools:
- PM2 for process management
- PostgreSQL performance monitoring
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Log aggregation (ELK stack)

## Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Update documentation
5. Submit pull request

## License

MIT

## Support

For issues and questions:
- Check documentation in `docs/`
- Review API documentation
- Check troubleshooting section
- Contact development team
