export default function JobSearchCompaniesPage() {
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
      <div style={{fontSize: '48px'}}>🏢</div>
      <div style={{fontSize: '18px', fontWeight: '600', color: '#111827'}}>
        Companies
      </div>
      <div style={{fontSize: '14px', textAlign: 'center', maxWidth: '400px'}}>
        The companies you&apos;re targeting for roles will appear here,
        with the founders and hiring managers worth reaching out to.
      </div>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        background: '#f9fafb',
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid #e5e7eb',
      }}>
        Coming soon — company targeting
      </div>
    </div>
  )
}
