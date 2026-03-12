import { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodeStatus, SearchFilters } from '../types';
import { StartNode } from './nodes/StartNode';
import { ProcessNode } from './nodes/ProcessNode';
import { ResultNode } from './nodes/ResultNode';

interface AgentFlowCanvasProps {
  nodeStatuses: Record<string, NodeStatus>;
  nodeMessages: Record<string, string>;
  searchFilters?: SearchFilters;
  contactCount?: number;
}

const nodeTypes: NodeTypes = {
  startNode: StartNode,
  processNode: ProcessNode,
  resultNode: ResultNode,
};

export function AgentFlowCanvas({
  nodeStatuses,
  nodeMessages,
  searchFilters,
  contactCount,
}: AgentFlowCanvasProps) {
  const nodes: Node[] = useMemo(() => [
    {
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 175 },
      data: {
        label: 'Início',
        searchFilters,
      },
    },
    {
      id: 'agent',
      type: 'processNode',
      position: { x: 280, y: 175 },
      data: {
        label: 'Agente Claude',
        description: 'Orquestra o processo de busca',
        icon: '🤖',
        status: nodeStatuses['agent'] || 'idle',
        message: nodeMessages['agent'] || '',
      },
    },
    {
      id: 'search',
      type: 'processNode',
      position: { x: 510, y: 75 },
      data: {
        label: 'Buscar Perfis',
        description: 'Pesquisa no LinkedIn via Apify',
        icon: '🔍',
        status: nodeStatuses['search'] || 'idle',
        message: nodeMessages['search'] || '',
      },
    },
    {
      id: 'extract',
      type: 'processNode',
      position: { x: 510, y: 280 },
      data: {
        label: 'Extrair Contatos',
        description: 'Coleta email e telefone',
        icon: '📇',
        status: nodeStatuses['extract'] || 'idle',
        message: nodeMessages['extract'] || '',
      },
    },
    {
      id: 'validate',
      type: 'processNode',
      position: { x: 740, y: 175 },
      data: {
        label: 'Validar Dados',
        description: 'Verifica formato dos contatos',
        icon: '✅',
        status: nodeStatuses['validate'] || 'idle',
        message: nodeMessages['validate'] || '',
      },
    },
    {
      id: 'result',
      type: 'resultNode',
      position: { x: 970, y: 175 },
      data: {
        label: 'Resultados',
        status: nodeStatuses['result'] || 'idle',
        contactCount: contactCount || 0,
        message: nodeMessages['result'] || '',
      },
    },
  ], [nodeStatuses, nodeMessages, searchFilters, contactCount]);

  const edges: Edge[] = useMemo(() => {
    const getEdgeStyle = (sourceId: string) => {
      const status = nodeStatuses[sourceId];
      const isRunning = status === 'running';
      const isCompleted = status === 'completed';
      return {
        stroke: isRunning ? '#f0b429' : isCompleted ? '#00e5a0' : '#1e2d4a',
        strokeWidth: isRunning ? 2.5 : 1.5,
      };
    };

    return [
      {
        id: 'start-agent',
        source: 'start',
        target: 'agent',
        animated: nodeStatuses['agent'] === 'running',
        style: getEdgeStyle('start'),
      },
      {
        id: 'agent-search',
        source: 'agent',
        target: 'search',
        animated: nodeStatuses['search'] === 'running',
        style: getEdgeStyle('agent'),
      },
      {
        id: 'agent-extract',
        source: 'agent',
        target: 'extract',
        animated: nodeStatuses['extract'] === 'running',
        style: getEdgeStyle('agent'),
      },
      {
        id: 'search-validate',
        source: 'search',
        target: 'validate',
        animated: nodeStatuses['validate'] === 'running',
        style: getEdgeStyle('search'),
      },
      {
        id: 'extract-validate',
        source: 'extract',
        target: 'validate',
        animated: nodeStatuses['validate'] === 'running',
        style: getEdgeStyle('extract'),
      },
      {
        id: 'validate-result',
        source: 'validate',
        target: 'result',
        animated: nodeStatuses['result'] === 'running',
        style: getEdgeStyle('validate'),
      },
    ];
  }, [nodeStatuses]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <style>{`
        .react-flow__attribution { display: none; }
        .react-flow__controls button {
          background: #0d1525 !important;
          border: 1px solid #1e2d4a !important;
          color: #6b7fa3 !important;
          fill: #6b7fa3 !important;
        }
        .react-flow__controls button:hover {
          background: #1e2d4a !important;
          color: #f0b429 !important;
          fill: #f0b429 !important;
        }
        .react-flow__minimap {
          background: #0d1525 !important;
          border: 1px solid #1e2d4a !important;
          border-radius: 6px !important;
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 10px rgba(240, 180, 41, 0.3); }
          50% { box-shadow: 0 0 25px rgba(240, 180, 41, 0.6); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        style={{ background: '#050810' }}
        defaultEdgeOptions={{
          style: { stroke: '#1e2d4a', strokeWidth: 1.5 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1e2d4a"
          style={{ background: '#050810' }}
        />
        <Controls
          style={{
            bottom: 16,
            left: 16,
            top: 'auto',
          }}
        />
        <MiniMap
          style={{
            background: '#0d1525',
          }}
          nodeColor={(node) => {
            const status = (node.data as { status?: NodeStatus }).status || 'idle';
            const colors: Record<string, string> = {
              idle: '#1e2d4a',
              running: '#f0b429',
              completed: '#00e5a0',
              error: '#ff4757',
            };
            return colors[status] || '#1e2d4a';
          }}
          maskColor="rgba(5, 8, 16, 0.7)"
        />
      </ReactFlow>
    </div>
  );
}
