export default function JobSearchDashboardPage() {
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
      <div style={{fontSize: '48px'}}>💼</div>
      <div style={{fontSize: '18px', fontWeight: '600', color: '#111827'}}>
        Job Search Dashboard
      </div>
      <div style={{fontSize: '14px', textAlign: 'center', maxWidth: '400px'}}>
        Track your outreach pipeline, replies, and next actions
        across the founders and companies you&apos;re targeting.
      </div>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        background: '#f9fafb',
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        Coming soon — Job Search mode
      </div>
    </div>
  )
}
