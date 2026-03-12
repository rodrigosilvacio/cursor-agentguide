import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeStatus } from '../../types';

interface ProcessNodeData {
  label: string;
  description: string;
  icon: string;
  status: NodeStatus;
  message?: string;
  [key: string]: unknown;
}

const STATUS_COLORS: Record<NodeStatus, string> = {
  idle: '#3a4a6a',
  running: '#f0b429',
  completed: '#00e5a0',
  error: '#ff4757',
};

const STATUS_BG: Record<NodeStatus, string> = {
  idle: 'rgba(58, 74, 106, 0.15)',
  running: 'rgba(240, 180, 41, 0.15)',
  completed: 'rgba(0, 229, 160, 0.15)',
  error: 'rgba(255, 71, 87, 0.15)',
};

const STATUS_LABELS: Record<NodeStatus, string> = {
  idle: 'AGUARDANDO',
  running: 'EXECUTANDO',
  completed: 'CONCLUÍDO',
  error: 'ERRO',
};

const STATUS_ICONS: Record<NodeStatus, string> = {
  idle: '○',
  running: '◉',
  completed: '✓',
  error: '✗',
};

export function ProcessNode({ data }: NodeProps) {
  const nodeData = data as ProcessNodeData;
  const status = nodeData.status || 'idle';
  const color = STATUS_COLORS[status];

  return (
    <div
      style={{
        background: `linear-gradient(135deg, #0d1525 0%, #0a1020 100%)`,
        border: `1px solid ${color}`,
        borderRadius: '10px',
        padding: '14px 16px',
        minWidth: '170px',
        maxWidth: '200px',
        boxShadow: status === 'running'
          ? `0 0 20px ${color}50, 0 4px 20px rgba(0,0,0,0.4)`
          : status === 'completed'
          ? `0 0 12px ${color}30, 0 4px 16px rgba(0,0,0,0.3)`
          : '0 4px 16px rgba(0,0,0,0.3)',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: status === 'idle' ? 0.7 : 1,
        transition: 'all 0.3s ease',
        position: 'relative',
        animation: status === 'running' ? 'pulse-border 1.5s ease-in-out infinite' : 'none',
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          borderRadius: '10px 10px 0 0',
          opacity: status === 'idle' ? 0.3 : 1,
        }}
      />

      {/* Status dot */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          boxShadow: status === 'running' ? `0 0 8px ${color}` : 'none',
          animation: status === 'running' ? 'blink 1s ease-in-out infinite' : 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '16px' }}>{nodeData.icon}</span>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '12px',
            color: color,
            letterSpacing: '0.5px',
          }}
        >
          {nodeData.label}
        </span>
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: '10px',
          color: '#6b7fa3',
          marginBottom: '10px',
          lineHeight: '1.4',
        }}
      >
        {nodeData.description}
      </div>

      {/* Status badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: STATUS_BG[status],
          border: `1px solid ${color}40`,
          borderRadius: '4px',
          padding: '2px 7px',
          fontSize: '9px',
          color: color,
          letterSpacing: '0.5px',
        }}
      >
        <span style={{
          display: 'inline-block',
          animation: status === 'running' ? 'spin 1s linear infinite' : 'none',
        }}>
          {STATUS_ICONS[status]}
        </span>
        {STATUS_LABELS[status]}
      </div>

      {/* Message */}
      {nodeData.message && status !== 'idle' && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '9px',
            color: '#6b7fa3',
            borderTop: '1px solid #1e2d4a',
            paddingTop: '6px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nodeData.message}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, border: '2px solid #050810', width: '10px', height: '10px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, border: '2px solid #050810', width: '10px', height: '10px' }}
      />
    </div>
  );
}
