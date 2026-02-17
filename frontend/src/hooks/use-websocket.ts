'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_URL } from '@/lib/server-config';

type WebSocketStatus = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

interface UseWebSocketOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  lastMessage: MessageEvent | null;
  status: WebSocketStatus;
  sendMessage: (message: string | object) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  url = WS_URL,
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  autoConnect = true,
}: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('CLOSED');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(autoConnect);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!url) {
      setStatus('CLOSED');
      return;
    }

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      setStatus('CONNECTING');
      const socket = new WebSocket(url);
      socketRef.current = socket;
      setSocket(socket);

      socket.onopen = () => {
        setStatus('OPEN');
        reconnectCountRef.current = 0;
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        setLastMessage(event);
      };

      socket.onerror = () => {
        console.warn('WebSocket connection error');
      };

      socket.onclose = () => {
        setStatus('CLOSED');
        socketRef.current = null;
        setSocket(null);
        
        // Attempt reconnection if meant to be connected
        if (shouldReconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          console.log(`WebSocket closed. Reconnecting attempt ${reconnectCountRef.current + 1}/${reconnectAttempts}...`);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connectRef.current();
          }, reconnectInterval);
        } else if (reconnectCountRef.current >= reconnectAttempts) {
            console.error('WebSocket reconnection failed: max attempts reached');
        }
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setStatus('CLOSED');
    }
  }, [url, reconnectAttempts, reconnectInterval]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
    }
  }, []);

  const sendMessage = useCallback((message: string | object) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      socketRef.current.send(data);
    } else {
      console.warn('WebSocket is not open. Cannot send message:', message);
    }
  }, []);

  useEffect(() => {
    let initialConnectTimer: NodeJS.Timeout | null = null;
    if (autoConnect) {
        shouldReconnectRef.current = true;
        initialConnectTimer = setTimeout(() => {
          connect();
        }, 0);
    }

    return () => {
      if (initialConnectTimer) {
        clearTimeout(initialConnectTimer);
      }
      shouldReconnectRef.current = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [connect, autoConnect]);

  return {
    socket,
    lastMessage,
    status,
    sendMessage,
    connect,
    disconnect,
  };
}
