'use client'

export default function DemoBanner() {
  return (
    <div style={{
      width: '100%',
      background: 'linear-gradient(90deg, #854F0B, #92400e)',
      color: '#fef3c7',
      fontSize: '13px',
      fontWeight: '500',
      textAlign: 'center',
      padding: '8px 16px',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      zIndex: 9999,
      position: 'relative',
    }}>
      <span>⏸</span>
      <span>Demo Mode — Agents paused. Existing pipeline data is live. No new credits consumed.</span>
    </div>
  )
}
