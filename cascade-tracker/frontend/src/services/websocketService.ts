import { useChatStore } from '../store/chatStore';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private userId: string | null = null;
  private sessionId: string | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();

  connect(userId: string) {
    this.userId = userId;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3002';

    console.log(`🔌 Connecting to WebSocket at ${wsUrl} with user ID: ${userId}`);

    try {
      useChatStore.getState().setConnecting(true);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        useChatStore.getState().setConnected(true);
        useChatStore.getState().setConnecting(false);
        useChatStore.getState().setConnectionError(null);
        this.reconnectAttempts = 0;

        // Send authentication message
        console.log('📤 Sending auth message to server...');
        this.send({
          type: 'auth',
          userId: this.userId,
          sessionId: this.sessionId,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        useChatStore.getState().setConnectionError('Connection error');
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        useChatStore.getState().setConnected(false);
        this.ws = null;

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

          setTimeout(() => {
            if (this.userId) {
              this.connect(this.userId);
            }
          }, this.reconnectDelay * this.reconnectAttempts);
        } else {
          useChatStore.getState().setConnectionError('Failed to connect after multiple attempts');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      useChatStore.getState().setConnectionError('Failed to create connection');
    }
  }

  private handleMessage(data: any) {
    const { type } = data;

    switch (type) {
      case 'auth_success':
        this.sessionId = data.sessionId;
        console.log('✅ Authenticated with session:', this.sessionId);
        break;

      case 'stream':
        this.handleStreamMessage(data.content);
        break;

      case 'processing':
        useChatStore.getState().setProcessing(true);
        break;

      case 'error':
        console.error('Server error:', data.message);
        useChatStore.getState().addMessage({
          role: 'assistant',
          content: `Error: ${data.message}`,
        });
        useChatStore.getState().setProcessing(false);
        break;

      case 'status':
        console.log('Status:', data.message);
        useChatStore.getState().setStatusMessage(data.message);
        break;

      default:
        console.log('Unknown message type:', type, data);
    }

    // Call registered handlers
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  private handleStreamMessage(content: string) {
    const store = useChatStore.getState();

    if (content === '[END]') {
      // Finalize the streaming message
      store.finalizeStreamingMessage();
    } else {
      // Append to current streaming message
      store.appendStreamingContent(content);
    }
  }

  sendMessage(message: string) {
    if (!this.isConnected()) {
      console.error('WebSocket not connected');
      return;
    }

    this.send({
      type: 'message',
      userId: this.userId,
      content: message,
    });
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.error('Cannot send message, WebSocket not open');
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.userId = null;
    this.sessionId = null;
    useChatStore.getState().setConnected(false);
  }

  // Register message handler
  on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  // Unregister message handler
  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
