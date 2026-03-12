export type NodeStatus = 'idle' | 'running' | 'completed' | 'error';

export interface AgentNode {
  id: string;
  label: string;
  description: string;
  status: NodeStatus;
  message?: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
  title?: string;
  company?: string;
  location?: string;
}

export interface SearchFilters {
  cargo: string;
  cidade: string;
}

export type WSMessage =
  | { type: 'node_update'; node_id: string; status: NodeStatus; message?: string; data?: unknown }
  | { type: 'results'; contacts: Contact[] }
  | { type: 'agent_thinking'; text: string }
  | { type: 'error'; message: string };
