import { useState, useCallback, useEffect } from 'react';
import { SearchFilters } from './types';
import { useAgentWebSocket } from './hooks/useAgentWebSocket';
import { AgentFlowCanvas } from './components/AgentFlowCanvas';
import { FilterForm } from './components/FilterForm';
import { ResultsTable } from './components/ResultsTable';

export default function App() {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters | undefined>(undefined);

  const { nodeStatuses, nodeMessages, contacts, agentThinking, isConnected, error } =
    useAgentWebSocket(taskId);

  // Detect when agent is done running and reset isRunning
  useEffect(() => {
    if (!isConnected && taskId !== null && isRunning) {
      const isDone =
        nodeStatuses['result'] === 'completed' ||
        nodeStatuses['agent'] === 'error' ||
        error !== null;
      if (isDone) {
        setIsRunning(false);
      }
    }
  }, [isConnected, taskId, isRunning, nodeStatuses, error]);

  const handleSubmit = useCallback(async (filters: SearchFilters) => {
    setIsRunning(true);
    setSearchFilters(filters);

    try {
      const response = await fetch('http://localhost:8000/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = (await response.json()) as { task_id: string };
      setTaskId(data.task_id);
    } catch (err) {
      console.error('Failed to start search:', err);
      setIsRunning(false);
    }
  }, []);

  const statusDotColor = isConnected
    ? '#00e5a0'
    : isRunning
    ? '#f0b429'
    : error
    ? '#ff4757'
    : '#3a4a6a';

  const statusText = isConnected
    ? 'CONECTADO'
    : isRunning
    ? 'INICIANDO...'
    : contacts.length > 0
    ? `${contacts.length} CONTATOS`
    : 'AGUARDANDO';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#050810',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        gridTemplateColumns: '350px 1fr',
        gridTemplateAreas: '"header header" "sidebar main"',
        overflow: 'hidden',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Header */}
      <div
        style={{
          gridArea: 'header',
          background: '#0d1525',
          borderBottom: '1px solid #1e2d4a',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #f0b429, #e09a1a)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            🔗
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '15px',
                color: '#e8dcc8',
                letterSpacing: '1px',
                lineHeight: '1.1',
              }}
            >
              LinkedIn Intelligence Agent
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                color: '#6b7fa3',
                letterSpacing: '0.5px',
              }}
            >
              Neural Operations Terminal v1.0
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusDotColor,
              boxShadow: isConnected ? `0 0 8px ${statusDotColor}` : 'none',
              animation: isConnected ? 'blink 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: statusDotColor,
              letterSpacing: '1px',
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Sidebar */}
      <div
        style={{
          gridArea: 'sidebar',
          background: '#080e1a',
          borderRight: '1px solid #1e2d4a',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <FilterForm
          onSubmit={handleSubmit}
          isRunning={isRunning}
          agentThinking={agentThinking}
        />
      </div>

      {/* Main area */}
      <div
        style={{
          gridArea: 'main',
          display: 'grid',
          gridTemplateRows: '55% 45%',
          overflow: 'hidden',
        }}
      >
        {/* Flow canvas */}
        <div
          style={{
            borderBottom: '1px solid #1e2d4a',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <AgentFlowCanvas
            nodeStatuses={nodeStatuses}
            nodeMessages={nodeMessages}
            searchFilters={searchFilters}
            contactCount={contacts.length}
          />
        </div>

        {/* Results table */}
        <div style={{ overflow: 'hidden' }}>
          <ResultsTable contacts={contacts} />
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0d1525',
            border: '1px solid #ff4757',
            borderRadius: '8px',
            padding: '12px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#ff4757',
            maxWidth: '300px',
            boxShadow: '0 4px 20px rgba(255, 71, 87, 0.3)',
            zIndex: 1000,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '4px' }}>ERRO</div>
          {error}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; background: #050810; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #050810; }
        ::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a4a6a; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
