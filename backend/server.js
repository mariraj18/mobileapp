require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocket = require('ws');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');
const cronJobs = require('./src/utils/cronJobs');
const jwt = require('jsonwebtoken');

const authRoutes = require('./src/routes/authRoutes');
const workspaceRoutes = require('./src/routes/workspaceRoutes');
const projectRoutes = require('./src/routes/projectRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const attachmentRoutes = require('./src/routes/attachmentRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');

// WebSocket server setup
class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket[]
    
    this.wss.on('connection', this.handleConnection.bind(this));
    logger.info('WebSocket server initialized');
  }

  handleConnection(ws, req) {
    // Extract token from query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Authentication required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      if (!this.clients.has(userId)) {
        this.clients.set(userId, []);
      }
      this.clients.get(userId).push(ws);

      ws.userId = userId;

      ws.on('close', () => {
        this.handleDisconnection(userId, ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.handleDisconnection(userId, ws);
      });

      logger.info(`WebSocket connected for user ${userId}`);
    } catch (error) {
      logger.error('WebSocket authentication error:', error);
      ws.close(1008, 'Invalid token');
    }
  }

  handleDisconnection(userId, ws) {
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      const index = userClients.indexOf(ws);
      if (index > -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(userId);
      }
    }
  }

  sendToUser(userId, message) {
    if (this.clients.has(userId)) {
      const userClients = this.clients.get(userId);
      userClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
    }
  }

  broadcastToUsers(userIds, message) {
    userIds.forEach(userId => {
      this.sendToUser(userId, message);
    });
  }

  getClientCount() {
    return this.clients.size;
  }

  getTotalConnections() {
    let total = 0;
    for (const clients of this.clients.values()) {
      total += clients.length;
    }
    return total;
  }
}

const app = express();
const server = http.createServer(app);
const websocketServer = new WebSocketServer(server);

// Make websocket server available to controllers
global.websocketServer = websocketServer;

const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiter for OPTIONS requests
});

app.use(helmet());

// ========== FIXED CORS CONFIGURATION - MUST BE FIRST ==========
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable or use defaults
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:3000'];
    
    // Always allow your Render domain
    if (origin.includes('mobileapp-ocya.onrender.com')) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware to ALL routes BEFORE any other middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', cors(corsOptions));
// ===============================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware for auth endpoints
app.use((req, res, next) => {
  if (req.path.includes('/auth/')) {
    logger.info(`[DEBUG] Incoming ${req.method} ${req.path}`);
    logger.info(`[DEBUG] Origin: ${req.headers.origin}`);
    logger.info(`[DEBUG] Content-Type: ${req.headers['content-type']}`);
    if (req.method === 'OPTIONS') {
      logger.info(`[DEBUG] OPTIONS preflight request for ${req.path}`);
    }
  }
  next();
});

app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(passport.initialize());
require('./config/passport')(passport);

// API Routes - Rate limiter now skips OPTIONS automatically
app.use('/api/auth', limiter, authRoutes);
app.use(`/api/${API_VERSION}/workspaces`, workspaceRoutes);
app.use(`/api/${API_VERSION}/projects`, projectRoutes);
app.use(`/api/${API_VERSION}/tasks`, taskRoutes);
app.use(`/api/${API_VERSION}/comments`, commentRoutes);
app.use(`/api/${API_VERSION}/attachments`, attachmentRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);

// Health check endpoint with WebSocket status
app.get('/', (req, res) => {
  res.send('Backend is live');
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    websocket: {
      active: true,
      connectedUsers: websocketServer.getClientCount(),
      totalConnections: websocketServer.getTotalConnections(),
    },
  });
});

// WebSocket connection endpoint info
app.get('/api/ws-info', (req, res) => {
  res.status(200).json({
    wsUrl: `${req.headers['x-forwarded-proto'] === 'https' ? 'wss' : 'ws'}://${req.headers.host}`,
    requiresToken: true,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synchronized');
    }

    cronJobs.startNotificationJobs();
    logger.info('Cron jobs started');

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`API Base URL: http://0.0.0.0:${PORT}/api/${API_VERSION}`);
      logger.info(`WebSocket URL: ws://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing connections...');
  
  // Close all WebSocket connections
  websocketServer.wss.close(() => {
    logger.info('WebSocket server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    sequelize.close().then(() => {
      logger.info('Database connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = { app, server, websocketServer };