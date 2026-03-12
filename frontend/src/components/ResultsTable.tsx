import { useState } from 'react';
import { Contact } from '../types';

interface ResultsTableProps {
  contacts: Contact[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copiar"
      style={{
        background: 'none',
        border: '1px solid #1e2d4a',
        borderRadius: '3px',
        padding: '2px 5px',
        cursor: 'pointer',
        color: copied ? '#00e5a0' : '#6b7fa3',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '9px',
        marginLeft: '6px',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}

export function ResultsTable({ contacts }: ResultsTableProps) {
  const downloadCSV = () => {
    if (contacts.length === 0) return;
    const headers = ['Nome', 'Cargo', 'Empresa', 'Email', 'Telefone', 'Localização'];
    const rows = contacts.map((c) => [
      c.name,
      c.title || '',
      c.company || '',
      c.email,
      c.phone,
      c.location || '',
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linkedin-contacts-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#050810',
        overflow: 'hidden',
      }}
    >
      {/* Table header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid #1e2d4a',
          background: '#0d1525',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px' }}>📋</span>
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '12px',
              color: '#e8dcc8',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}
          >
            Contatos Encontrados
          </span>
          {contacts.length > 0 && (
            <span
              style={{
                background: 'rgba(0, 229, 160, 0.15)',
                border: '1px solid rgba(0, 229, 160, 0.4)',
                borderRadius: '10px',
                padding: '1px 8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                color: '#00e5a0',
              }}
            >
              {contacts.length}
            </span>
          )}
        </div>

        {contacts.length > 0 && (
          <button
            onClick={downloadCSV}
            style={{
              background: 'rgba(240, 180, 41, 0.1)',
              border: '1px solid #f0b42960',
              borderRadius: '5px',
              padding: '5px 12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#f0b429',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240, 180, 41, 0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(240, 180, 41, 0.1)';
            }}
          >
            ↓ EXPORTAR CSV
          </button>
        )}
      </div>

      {/* Table content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {contacts.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: '12px',
              color: '#3a4a6a',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '12px',
            }}
          >
            <span style={{ fontSize: '32px', opacity: 0.4 }}>📭</span>
            Nenhum contato encontrado ainda...
          </div>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
            }}
          >
            <thead>
              <tr
                style={{
                  background: '#0d1525',
                  borderBottom: '2px solid #f0b42930',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {['Nome', 'Cargo / Empresa', 'Email', 'Telefone'].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      fontSize: '10px',
                      color: '#f0b429',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, index) => (
                <tr
                  key={index}
                  style={{
                    borderBottom: '1px solid #1e2d4a',
                    animation: `fadeInRow 0.3s ease forwards`,
                    animationDelay: `${index * 0.05}s`,
                    opacity: 0,
                    background: index % 2 === 0 ? 'transparent' : 'rgba(13, 21, 37, 0.4)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(240, 180, 41, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      index % 2 === 0 ? 'transparent' : 'rgba(13, 21, 37, 0.4)';
                  }}
                >
                  <td style={{ padding: '8px 12px', color: '#e8dcc8', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 500, color: '#e8dcc8' }}>{contact.name}</div>
                    {contact.location && (
                      <div style={{ fontSize: '9px', color: '#6b7fa3', marginTop: '1px' }}>
                        📍 {contact.location}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#6b7fa3' }}>
                    {contact.title && (
                      <div style={{ color: '#e8dcc8', fontSize: '11px' }}>{contact.title}</div>
                    )}
                    {contact.company && (
                      <div style={{ fontSize: '10px', color: '#00e5a0', marginTop: '1px' }}>
                        🏢 {contact.company}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: contact.email ? '#6b7fa3' : '#3a4a6a' }}>
                        {contact.email || '—'}
                      </span>
                      {contact.email && <CopyButton text={contact.email} />}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: contact.phone ? '#6b7fa3' : '#3a4a6a' }}>
                        {contact.phone || '—'}
                      </span>
                      {contact.phone && <CopyButton text={contact.phone} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes fadeInRow {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
