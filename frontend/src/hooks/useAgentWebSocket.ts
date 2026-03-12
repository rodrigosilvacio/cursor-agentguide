import { useState, useEffect, useRef, useCallback } from 'react';
import { NodeStatus, Contact, WSMessage } from '../types';

interface UseAgentWebSocketReturn {
  nodeStatuses: Record<string, NodeStatus>;
  nodeMessages: Record<string, string>;
  contacts: Contact[];
  agentThinking: string[];
  isConnected: boolean;
  error: string | null;
}

export function useAgentWebSocket(taskId: string | null): UseAgentWebSocketReturn {
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [nodeMessages, setNodeMessages] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agentThinking, setAgentThinking] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleMessage = useCallback((message: WSMessage) => {
    switch (message.type) {
      case 'node_update':
        setNodeStatuses(prev => ({ ...prev, [message.node_id]: message.status }));
        if (message.message) {
          setNodeMessages(prev => ({ ...prev, [message.node_id]: message.message! }));
        }
        break;

      case 'results':
        setContacts(message.contacts);
        break;

      case 'agent_thinking':
        setAgentThinking(prev => [...prev, message.text]);
        break;

      case 'error':
        setError(message.message);
        break;
    }
  }, []);

  useEffect(() => {
    if (!taskId) return;

    setNodeStatuses({});
    setNodeMessages({});
    setContacts([]);
    setAgentThinking([]);
    setError(null);
    setIsConnected(false);

    const ws = new WebSocket(`ws://localhost:8000/ws/${taskId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as WSMessage;
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    ws.onerror = () => {
      setError('Erro de conexão com o servidor');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [taskId, handleMessage]);

  return {
    nodeStatuses,
    nodeMessages,
    contacts,
    agentThinking,
    isConnected,
    error,
  };
}
