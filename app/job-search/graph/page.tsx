export default function JobSearchGraphPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      color: '#6b7280',
      gap: '12px',
    }}>
      <div style={{fontSize: '48px'}}>🕸️</div>
      <div style={{fontSize: '18px', fontWeight: '600', color: '#111827'}}>
        Mind Map
      </div>
      <div style={{fontSize: '14px', textAlign: 'center', maxWidth: '400px'}}>
        Your company knowledge graph will appear here once
        you start targeting companies in Job Search mode.
      </div>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        background: '#f9fafb',
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        Coming soon — D3 force-directed graph
      </div>
    </div>
  )
}
