const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> WebSocket[]

    this.wss.on('connection', this.handleConnection.bind(this));
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
        console.error('WebSocket error:', error);
        this.handleDisconnection(userId, ws);
      });

      console.log(`WebSocket connected for user ${userId}`);
    } catch (error) {
      console.error('WebSocket authentication error:', error);
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

  broadcastToProject(projectId, userIds, message) {
    userIds.forEach(userId => {
      this.sendToUser(userId, {
        ...message,
        projectId,
      });
    });
  }

  broadcastToWorkspace(workspaceId, userIds, message) {
    userIds.forEach(userId => {
      this.sendToUser(userId, {
        ...message,
        workspaceId,
      });
    });
  }
}

module.exports = WebSocketServer;
