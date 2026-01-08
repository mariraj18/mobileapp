# Distributed Task Management System

A production-grade distributed task management system similar to ClickUp, featuring a robust Node.js/Express backend with PostgreSQL database and a React Native/Expo mobile application.

## Project Overview

This is a complete, enterprise-ready task management system designed for teams and organizations. It includes workspace management, project organization, task tracking with assignments, comments, file attachments, and automated notifications.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native Mobile App                   │
│                    (Expo + TypeScript)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API over HTTPS
                       │ JWT Authentication
┌──────────────────────▼──────────────────────────────────────┐
│              Node.js/Express Backend API                     │
│              (JWT + Passport.js + RBAC)                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ Sequelize ORM
┌──────────────────────▼──────────────────────────────────────┐
│                   PostgreSQL Database                        │
│            (Users, Workspaces, Projects, Tasks)              │
└──────────────────────────────────────────────────────────────┘
```

## Key Features

### Backend (Node.js/Express/PostgreSQL)
- JWT-based authentication with refresh tokens
- Role-based access control (OWNER, ADMIN, MEMBER)
- RESTful API with comprehensive validation
- Workspace and project hierarchy
- Task management with status and priority tracking
- User assignments and team collaboration
- Comments system with edit/delete time windows
- File attachments (up to 10MB)
- Automated notifications via cron jobs
- Due date and priority alerts
- Comprehensive error handling and logging
- Rate limiting and security best practices

### Mobile App (React Native/Expo)
- Cross-platform mobile application (iOS/Android/Web)
- JWT authentication with automatic token refresh
- Secure token storage with AsyncStorage
- Workspace browsing and management
- Task viewing and updates
- User profile management
- Responsive and intuitive UI
- Offline-first architecture ready

### Database (PostgreSQL)
- Normalized relational schema
- Foreign key constraints for data integrity
- Indexed columns for performance
- Row Level Security (RLS) policies
- Automated timestamp management
- Cascading deletes for referential integrity

## Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: PostgreSQL 12+ (Supabase)
- **ORM**: Sequelize
- **Authentication**: JWT with Passport.js
- **Validation**: Joi
- **File Upload**: Multer
- **Security**: Helmet, bcrypt
- **Logging**: Winston
- **Cron Jobs**: node-cron

### Frontend (Mobile)
- **Framework**: React Native with Expo SDK
- **Language**: TypeScript
- **Navigation**: Expo Router
- **State Management**: React Context API
- **HTTP Client**: Fetch API
- **Storage**: AsyncStorage
- **Icons**: Lucide React Native

## Project Structure

```
task-management-system/
├── backend/                    # Node.js/Express API
│   ├── config/                # Configuration files
│   │   ├── database.js
│   │   ├── passport.js
│   │   └── constants.js
│   ├── src/
│   │   ├── models/           # Sequelize models
│   │   ├── controllers/      # Request handlers
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, validation, RBAC
│   │   └── utils/            # Helpers, validators, cron
│   ├── uploads/              # File upload directory
│   ├── logs/                 # Application logs
│   ├── docs/                 # API documentation
│   ├── server.js            # Entry point
│   ├── package.json
│   └── README.md
│
├── app/                        # Mobile app (Expo)
│   ├── (auth)/                # Authentication screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx          # Workspaces
│   │   ├── tasks.tsx
│   │   ├── notifications.tsx
│   │   └── profile.tsx
│   └── _layout.tsx            # Root layout with auth
│
├── contexts/                   # React contexts
│   └── AuthContext.tsx
│
├── utils/                      # Utilities
│   └── api/                   # API client
│       ├── client.ts
│       ├── auth.ts
│       ├── workspaces.ts
│       └── tasks.ts
│
├── types/                      # TypeScript types
│   └── env.d.ts
│
├── package.json
├── tsconfig.json
├── app.json
└── README.md
```

## Database Schema

### Core Tables

1. **users**: User accounts with authentication
2. **workspaces**: Team workspaces/organizations
3. **workspace_members**: User-workspace relationships with roles (RBAC)
4. **projects**: Projects within workspaces
5. **tasks**: Task items with status, priority, due dates
6. **task_assignments**: User-task assignments (many-to-many)
7. **task_comments**: Comments on tasks
8. **task_attachments**: File attachment metadata
9. **notifications**: User notifications (due dates, assignments, comments)

### Relationships

- Workspace → has many Projects
- Project → has many Tasks
- Task → has many Comments, Attachments, Assignments
- User → belongs to many Workspaces (through workspace_members)
- User → assigned to many Tasks (through task_assignments)

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+ or Supabase account
- Expo CLI (for mobile development)
- iOS Simulator (macOS) or Android Emulator

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Setup database:
```bash
# Using Sequelize CLI
npx sequelize-cli db:create
npx sequelize-cli db:migrate

# Or use the Supabase migration that's already applied
```

5. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Mobile App Setup

1. Install dependencies (from project root):
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Update EXPO_PUBLIC_API_URL with your backend URL
```

3. Install required packages:
```bash
npx expo install @react-native-async-storage/async-storage
```

4. Start Expo development server:
```bash
npm run dev
```

5. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device
- Press `w` for web browser

## API Documentation

Comprehensive API documentation is available in `backend/docs/API.md`.

### Quick API Examples

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Create Workspace:**
```bash
curl -X POST http://localhost:5000/api/v1/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"name":"My Workspace"}'
```

## Authentication & Authorization

### JWT Authentication
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Automatic token refresh in mobile app
- Secure token storage with AsyncStorage

### RBAC (Role-Based Access Control)
- **OWNER**: Full control (create/update/delete workspace, manage all resources)
- **ADMIN**: Manage projects, tasks, and members (cannot delete workspace)
- **MEMBER**: Create tasks, add comments, upload files (limited management)

All permissions enforced server-side with middleware.

## Security Features

- Password hashing with bcrypt (10 rounds)
- JWT tokens with HS256 algorithm
- SQL injection prevention (Sequelize ORM)
- XSS prevention (input validation)
- CORS configuration
- Helmet security headers
- Rate limiting (100 requests per 15 minutes)
- File type and size validation
- Row Level Security (RLS) in database

## Notifications System

Automated notifications via cron jobs:
- Tasks due within 24 hours
- Overdue tasks
- Task assignments
- New comments
- High-priority task alerts

Cron jobs run every 30 minutes (configurable).

## Development

### Running Tests
```bash
cd backend
npm test
```

### Code Style
- ES6+ features
- Async/await for asynchronous operations
- Comprehensive error handling
- JSDoc comments for complex logic

### Adding New Features

1. Backend:
   - Create/update Sequelize models
   - Add controllers and routes
   - Implement middleware if needed
   - Update validators
   - Add tests
   - Update API documentation

2. Mobile App:
   - Create API client methods
   - Build UI components
   - Add navigation routes
   - Implement state management
   - Test on iOS/Android

## Deployment

### Backend Deployment

**Option 1: Using PM2**
```bash
npm install -g pm2
pm2 start server.js --name task-management
pm2 save
pm2 startup
```

**Option 2: Docker**
```bash
docker build -t task-management-backend ./backend
docker run -p 5000:5000 --env-file .env task-management-backend
```

**Option 3: Cloud Platforms**
- Deploy to Heroku, AWS, Google Cloud, Azure
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Configure environment variables
- Enable HTTPS
- Setup monitoring and logging

### Mobile App Deployment

**Build for Production:**
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

**Publish Updates:**
```bash
eas update --branch production
```

See [Expo documentation](https://docs.expo.dev/build/introduction/) for detailed deployment guide.

## Performance Optimization

- Database indexes on frequently queried columns
- Connection pooling (max 20 connections in production)
- Pagination for all list endpoints (default 20, max 100)
- Efficient Sequelize queries with proper includes
- File upload size limits (10MB)
- Rate limiting to prevent abuse

## Monitoring & Maintenance

Recommended tools:
- **Process Management**: PM2
- **Database**: PostgreSQL monitoring tools
- **Application Performance**: New Relic, Datadog
- **Error Tracking**: Sentry
- **Log Aggregation**: ELK stack (Elasticsearch, Logstash, Kibana)
- **Uptime Monitoring**: UptimeRobot, Pingdom

## Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U postgres -h localhost
```

**Port Already in Use:**
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Mobile App Issues

**Metro Bundler Error:**
```bash
# Clear cache
npx expo start -c
```

**Module Not Found:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing the System

### Test User Flow

1. **Register an account** in the mobile app
2. **Create a workspace** (you become the OWNER)
3. **Invite team members** (assign ADMIN or MEMBER roles)
4. **Create projects** within the workspace
5. **Create tasks** with priorities and due dates
6. **Assign tasks** to team members
7. **Add comments** and **upload attachments**
8. **Receive notifications** for due dates and assignments

## Production Checklist

Backend:
- [ ] Set NODE_ENV=production
- [ ] Use strong JWT secrets
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Setup CORS for production domain
- [ ] Configure rate limiting
- [ ] Setup error tracking
- [ ] Configure logging
- [ ] Enable database backups
- [ ] Setup monitoring

Mobile App:
- [ ] Update API URL to production
- [ ] Build production bundles
- [ ] Configure app signing
- [ ] Setup crash reporting
- [ ] Enable analytics
- [ ] Test on real devices
- [ ] Prepare app store listings
- [ ] Submit to App Store/Play Store

## Support & Documentation

- **Backend API Docs**: `backend/docs/API.md`
- **Backend Setup**: `backend/README.md`
- **Database Schema**: See database migration files
- **Authentication Flow**: See `contexts/AuthContext.tsx`
- **API Client**: See `utils/api/` directory

## License

MIT

## Acknowledgments

Built with:
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [Passport.js](http://www.passportjs.org/)

---

**Note**: This is a production-grade system with enterprise features including RBAC, automated notifications, comprehensive error handling, and security best practices. The system is designed to scale and can handle multiple workspaces with thousands of tasks.

For detailed setup instructions, see the respective README files in the `backend/` directory and API documentation in `backend/docs/`.
