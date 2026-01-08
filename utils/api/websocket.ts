import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private onMessageCallbacks: ((data: any) => void)[] = [];
  private onConnectCallbacks: (() => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];
  private isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  async connect() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token available for WebSocket');
        this.scheduleReconnect();
        return;
      }

      // Get WS URL from environment or use default
      const wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:5000';
      this.ws = new WebSocket(`${wsUrl}?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectCallbacks.forEach(callback => callback());
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.onDisconnectCallbacks.forEach(callback => callback());
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  private scheduleReconnect() {
    setTimeout(() => this.connect(), this.reconnectInterval);
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.scheduleReconnect();
    } else {
      console.log('Max reconnection attempts reached');
    }
  }

  private async handleMessage(data: any) {
    // Call all registered callbacks
    this.onMessageCallbacks.forEach(callback => callback(data));

    // Handle specific message types
    switch (data.type) {
      case 'NEW_NOTIFICATION':
        this.handleNewNotification(data.data);
        break;
      
      case 'TASK_UPDATED':
        // You might want to emit an event here for components to listen to
        this.emitTaskUpdate(data.data);
        break;
      
      case 'PROJECT_UPDATED':
        this.emitProjectUpdate(data.data);
        break;
      
      case 'WORKSPACE_INVITE':
        this.handleWorkspaceInvite(data.data);
        break;
    }
  }

  private async handleNewNotification(notification: any) {
    // Show alert for important notifications
    if (notification.type === 'ASSIGNMENT' || 
        notification.type === 'DUE_DATE' ||
        notification.type === 'URGENT') {
      Alert.alert(
        'New Notification',
        notification.message,
        [
          {
            text: 'View',
            onPress: () => {
              this.handleNotificationNavigation(notification);
            },
          },
          {
            text: 'Dismiss',
            style: 'cancel',
          },
        ]
      );
    }
  }

  private handleWorkspaceInvite(data: any) {
    Alert.alert(
      'Workspace Invitation',
      `You've been invited to join workspace "${data.workspaceName}"`,
      [
        {
          text: 'View',
          onPress: () => {
            // Navigate to workspace
            // You'll need to use your navigation method here
          },
        },
        {
          text: 'Dismiss',
          style: 'cancel',
        },
      ]
    );
  }

  private handleNotificationNavigation(notification: any) {
    // This would depend on your navigation structure
    console.log('Navigate to notification:', notification);
    // Example: navigate to task if task_id exists
    if (notification.task_id) {
      // router.push(`/task/${notification.task_id}`);
    }
  }

  private emitTaskUpdate(taskData: any) {
    // Emit custom event for task updates
    // You can use an event emitter library or React Context
  }

  private emitProjectUpdate(projectData: any) {
    // Emit custom event for project updates
  }

  // Public methods
  addMessageListener(callback: (data: any) => void) {
    this.onMessageCallbacks.push(callback);
  }

  removeMessageListener(callback: (data: any) => void) {
    this.onMessageCallbacks = this.onMessageCallbacks.filter(cb => cb !== callback);
  }

  addConnectListener(callback: () => void) {
    this.onConnectCallbacks.push(callback);
  }

  addDisconnectListener(callback: () => void) {
    this.onDisconnectCallbacks.push(callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getConnectedStatus() {
    return this.isConnected;
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();