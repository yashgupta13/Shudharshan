const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export class ChatWebSocket {
  constructor(roomId, token, handlers) {
    this.roomId = roomId;
    this.token = token;
    this.handlers = handlers;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnects = 5;
    this.reconnectDelay = 1000;
    this.intentionalClose = false;
    this._pingInterval = null;
  }

  connect() {
    this.intentionalClose = false;
    const url = `${WS_URL}/ws/${this.roomId}?token=${this.token}`;
    
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.handlers.onOpen?.();
      this._startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handlers.onMessage?.(data);
      } catch (e) {
        console.error('[WS] Parse error:', e);
      }
    };

    this.ws.onclose = (event) => {
      this._stopPing();
      this.handlers.onClose?.(event);

      if (!this.intentionalClose && this.reconnectAttempts < this.maxReconnects) {
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 10000);
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
        setTimeout(() => this.connect(), delay);
      } else if (this.reconnectAttempts >= this.maxReconnects) {
        this.handlers.onMaxReconnects?.();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      this.handlers.onError?.(err);
    };
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  disconnect() {
    this.intentionalClose = true;
    this._stopPing();
    this.ws?.close();
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  _startPing() {
    this._pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  _stopPing() {
    if (this._pingInterval) {
      clearInterval(this._pingInterval);
      this._pingInterval = null;
    }
  }
}

// Message type constants
export const MSG_TYPES = {
  MESSAGE: 'message',
  ENCRYPTED_MESSAGE: 'encrypted_message',
  DH_EXCHANGE: 'dh_exchange',
  DH_RESPONSE: 'dh_response',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  USER_JOIN: 'user_join',
  USER_LEAVE: 'user_leave',
  FILE: 'file',
  PING: 'ping',
  PONG: 'pong',
  ERROR: 'error',
};
