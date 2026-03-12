import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeStatus } from '../../types';

interface ResultNodeData {
  label: string;
  status: NodeStatus;
  contactCount?: number;
  message?: string;
  [key: string]: unknown;
}

export function ResultNode({ data }: NodeProps) {
  const nodeData = data as ResultNodeData;
  const status = nodeData.status || 'idle';
  const count = nodeData.contactCount || 0;
  const isActive = status === 'completed';

  return (
    <div
      style={{
        background: isActive
          ? 'linear-gradient(135deg, #0a2020 0%, #0d1525 100%)'
          : 'linear-gradient(135deg, #0d1525 0%, #0a1020 100%)',
        border: `2px solid ${isActive ? '#00e5a0' : '#1e2d4a'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '160px',
        boxShadow: isActive
          ? '0 0 24px rgba(0, 229, 160, 0.4), 0 4px 20px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3)',
        fontFamily: "'JetBrains Mono', monospace",
        opacity: status === 'idle' ? 0.6 : 1,
        transition: 'all 0.4s ease',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      {/* Top accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: isActive
            ? 'linear-gradient(90deg, transparent, #00e5a0, transparent)'
            : 'transparent',
          borderRadius: '12px 12px 0 0',
        }}
      />

      <div style={{ marginBottom: '8px', fontSize: '24px' }}>
        {isActive ? '🎯' : '📋'}
      </div>

      <div
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '13px',
          color: isActive ? '#00e5a0' : '#3a4a6a',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {nodeData.label}
      </div>

      {isActive && count > 0 && (
        <div
          style={{
            background: 'rgba(0, 229, 160, 0.1)',
            border: '1px solid rgba(0, 229, 160, 0.4)',
            borderRadius: '6px',
            padding: '6px 12px',
            marginBottom: '6px',
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '22px',
              color: '#00e5a0',
            }}
          >
            {count}
          </span>
          <div style={{ fontSize: '9px', color: '#6b7fa3', letterSpacing: '0.5px' }}>
            CONTATOS
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div style={{ fontSize: '10px', color: '#3a4a6a' }}>Aguardando...</div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isActive ? '#00e5a0' : '#3a4a6a',
          border: '2px solid #050810',
          width: '10px',
          height: '10px',
        }}
      />
    </div>
  );
}
