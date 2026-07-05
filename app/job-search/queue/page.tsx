export default function JobSearchQueuePage() {
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
      <div style={{fontSize: '48px'}}>✉️</div>
      <div style={{fontSize: '18px', fontWeight: '600', color: '#111827'}}>
        Outreach Queue
      </div>
      <div style={{fontSize: '14px', textAlign: 'center', maxWidth: '400px'}}>
        Drafted warm-outreach messages will queue here for your review
        and approval before they go out.
      </div>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        background: '#f9fafb',
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        Coming soon — outreach review
      </div>
    </div>
  )
}
