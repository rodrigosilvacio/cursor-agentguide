import { useState, useRef, useEffect } from 'react';
import { SearchFilters } from '../types';

interface FilterFormProps {
  onSubmit: (filters: SearchFilters) => void;
  isRunning: boolean;
  agentThinking: string[];
}

export function FilterForm({ onSubmit, isRunning, agentThinking }: FilterFormProps) {
  const [cargo, setCargo] = useState('');
  const [cidade, setCidade] = useState('');
  const thinkingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (thinkingRef.current) {
      thinkingRef.current.scrollTop = thinkingRef.current.scrollHeight;
    }
  }, [agentThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargo.trim() || !cidade.trim()) return;
    onSubmit({ cargo: cargo.trim(), cidade: cidade.trim() });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0' }}>
      {/* Form section */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid #1e2d4a',
          flexShrink: 0,
        }}
      >
        {/* Title */}
        <div style={{ marginBottom: '6px' }}>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '20px',
              color: '#f0b429',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            LINKEDIN
          </span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: '20px',
              color: '#e8dcc8',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              marginLeft: '6px',
            }}
          >
            AGENT
          </span>
        </div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#6b7fa3',
            marginBottom: '24px',
            letterSpacing: '0.5px',
          }}
        >
          Busca Inteligente de Contatos
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Cargo input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#6b7fa3',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              CARGO / FUNÇÃO
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="ex: CEO, Diretor de Marketing..."
              disabled={isRunning}
              style={{
                background: '#0d1525',
                border: '1px solid #1e2d4a',
                borderRadius: '6px',
                padding: '10px 14px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#e8dcc8',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: isRunning ? 0.5 : 1,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f0b429';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#1e2d4a';
              }}
            />
          </div>

          {/* Cidade input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#6b7fa3',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              CIDADE
            </label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="ex: São Paulo, Rio de Janeiro..."
              disabled={isRunning}
              style={{
                background: '#0d1525',
                border: '1px solid #1e2d4a',
                borderRadius: '6px',
                padding: '10px 14px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                color: '#e8dcc8',
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: isRunning ? 0.5 : 1,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f0b429';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#1e2d4a';
              }}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isRunning || !cargo.trim() || !cidade.trim()}
            style={{
              background: isRunning
                ? 'rgba(240, 180, 41, 0.1)'
                : 'linear-gradient(135deg, #f0b429, #e09a1a)',
              border: isRunning ? '1px solid #f0b42940' : '1px solid #f0b429',
              borderRadius: '6px',
              padding: '12px 20px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '13px',
              color: isRunning ? '#f0b42980' : '#050810',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              if (!isRunning) {
                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(240, 180, 41, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.target as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {isRunning ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                AGENTE EM EXECUÇÃO...
              </>
            ) : (
              <>
                ▶ INICIAR AGENTE
              </>
            )}
          </button>
        </form>
      </div>

      {/* Agent thinking terminal */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div
          style={{
            padding: '12px 24px 8px',
            borderBottom: '1px solid #1e2d4a',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff4757' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f0b429' }} />
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00e5a0' }} />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#6b7fa3',
              letterSpacing: '0.5px',
            }}
          >
            agent.log
          </span>
          {isRunning && (
            <div
              style={{
                marginLeft: 'auto',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#00e5a0',
                animation: 'blink 1s ease-in-out infinite',
              }}
            />
          )}
        </div>

        <div
          ref={thinkingRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 24px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            lineHeight: '1.7',
            color: '#6b7fa3',
          }}
        >
          {agentThinking.length === 0 ? (
            <div style={{ color: '#3a4a6a', fontStyle: 'italic' }}>
              {isRunning ? '> Inicializando agente...' : '> Aguardando início da busca...'}
            </div>
          ) : (
            agentThinking.map((text, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '4px',
                  color: index === agentThinking.length - 1 ? '#e8dcc8' : '#6b7fa3',
                }}
              >
                <span style={{ color: '#f0b429' }}>&gt; </span>
                {text}
              </div>
            ))
          )}
          {isRunning && (
            <div style={{ color: '#f0b429' }}>
              &gt; <span style={{ animation: 'blink 0.8s step-end infinite' }}>█</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
