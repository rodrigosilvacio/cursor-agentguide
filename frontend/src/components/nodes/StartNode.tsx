import { Handle, Position, NodeProps } from '@xyflow/react';
import { SearchFilters } from '../../types';

interface StartNodeData {
  label: string;
  searchFilters?: SearchFilters;
  [key: string]: unknown;
}

export function StartNode({ data }: NodeProps) {
  const nodeData = data as StartNodeData;
  const filters = nodeData.searchFilters;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0d1525 0%, #0a1020 100%)',
        border: '2px solid #f0b429',
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '160px',
        boxShadow: '0 0 20px rgba(240, 180, 41, 0.3), 0 4px 20px rgba(0,0,0,0.4)',
        fontFamily: "'JetBrains Mono', monospace",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #f0b429, transparent)',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: filters ? '10px' : '0' }}>
        <span style={{ fontSize: '18px' }}>🚀</span>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '13px',
            color: '#f0b429',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}
        >
          {nodeData.label}
        </span>
      </div>
      {filters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              background: 'rgba(240, 180, 41, 0.1)',
              border: '1px solid rgba(240, 180, 41, 0.3)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              color: '#f0b429',
            }}
          >
            {filters.cargo}
          </div>
          <div
            style={{
              background: 'rgba(0, 229, 160, 0.1)',
              border: '1px solid rgba(0, 229, 160, 0.3)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              color: '#00e5a0',
            }}
          >
            {filters.cidade}
          </div>
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#f0b429', border: '2px solid #050810', width: '10px', height: '10px' }}
      />
    </div>
  );
}
