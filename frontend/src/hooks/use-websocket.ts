'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
  url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  autoConnect = true,
}: UseWebSocketOptions = {}): UseWebSocketReturn {
  const [status, setStatus] = useState<WebSocketStatus>('CLOSED');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(autoConnect);

  const connect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    try {
      if (socketRef.current?.readyState === WebSocket.OPEN) return;

      setStatus('CONNECTING');
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus('OPEN');
        reconnectCountRef.current = 0;
        console.log('WebSocket connected');
      };

      socket.onmessage = (event) => {
        setLastMessage(event);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socket.onclose = (event) => {
        setStatus('CLOSED');
        socketRef.current = null;
        
        // Attempt reconnection if meant to be connected
        if (shouldReconnectRef.current && reconnectCountRef.current < reconnectAttempts) {
          console.log(`WebSocket closed. Reconnecting attempt ${reconnectCountRef.current + 1}/${reconnectAttempts}...`);
          reconnectTimerRef.current = setTimeout(() => {
            reconnectCountRef.current += 1;
            connect();
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

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
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
    if (autoConnect) {
        shouldReconnectRef.current = true;
        connect();
    }

    return () => {
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
    socket: socketRef.current,
    lastMessage,
    status,
    sendMessage,
    connect,
    disconnect,
  };
}
