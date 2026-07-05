'use client'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

const ADMIN_CLERK_ID = process.env.NEXT_PUBLIC_ADMIN_CLERK_ID || ''
const API = process.env.NEXT_PUBLIC_API_URL || ''

interface AgentStatus {
  abm_paused: boolean
  job_paused: boolean
}

export default function DemoBanner({ mode }: { mode: 'abm' | 'job_search' }) {
  const { user } = useUser()
  const [status, setStatus] = useState<AgentStatus>({
    abm_paused: false,
    job_paused: false,
  })
  const [loading, setLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isAdmin = user?.id === ADMIN_CLERK_ID
  const isPaused = mode === 'job_search' ? status.job_paused : status.abm_paused

  useEffect(() => {
    fetch(`${API}/api/admin/agent-status`)
      .then(r => r.json())
      .then(setStatus)
      .catch(() => {})

    const interval = setInterval(() => {
      fetch(`${API}/api/admin/agent-status`)
        .then(r => r.json())
        .then(setStatus)
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggle = async (type: 'abm' | 'job_search') => {
    const endpoint = type === 'abm'
      ? '/api/admin/toggle-abm'
      : '/api/admin/toggle-job-search'
    const currentPaused = type === 'abm'
      ? status.abm_paused
      : status.job_paused

    setLoading(type)
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pause: !currentPaused }),
      })
      const data = await res.json()
      setStatus(prev => ({
        ...prev,
        abm_paused: data.abm_paused ?? prev.abm_paused,
        job_paused: data.job_paused ?? prev.job_paused,
      }))

      const pause = !currentPaused
      const label = type === 'abm' ? 'ABM campaigns' : 'Job search'
      setToast(pause ? `⏸ ${label} paused` : `▶ ${label} resumed`)
      setTimeout(() => setToast(null), 3000)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  // Non-admin: only show banner when their current mode is paused
  if (!isAdmin) {
    if (!isPaused) return null
    return (
      <div style={{
        width: '100%',
        background: 'linear-gradient(90deg, #854F0B, #92400e)',
        color: '#fef3c7',
        fontSize: '13px',
        fontWeight: '500',
        textAlign: 'center',
        padding: '8px 16px',
      }}>
        ⏸ {mode === 'job_search' ? 'Job search' : 'Campaigns'} paused — back shortly
      </div>
    )
  }

  // Admin view — always visible, shows both controls
  return (
    <>
    <div style={{
      width: '100%',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      padding: '6px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      fontSize: '12px',
    }}>
      <span style={{color:'#64748b', fontWeight:'500'}}>Admin:</span>

      {/* ABM toggle */}
      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
        <span style={{color: status.abm_paused ? '#ef4444' : '#16a34a'}}>
          {status.abm_paused ? '⏸' : '▶'} ABM
        </span>
        <button
          onClick={() => toggle('abm')}
          disabled={loading === 'abm'}
          style={{
            padding: '2px 10px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: status.abm_paused ? '#16a34a' : '#ef4444',
            background: 'transparent',
            color: status.abm_paused ? '#16a34a' : '#ef4444',
            fontSize: '11px',
            cursor: loading === 'abm' ? 'wait' : 'pointer',
            fontWeight: '600',
          }}
        >
          {loading === 'abm' ? '...' : status.abm_paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <span style={{color:'#e2e8f0'}}>|</span>

      {/* Job Search toggle */}
      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
        <span style={{color: status.job_paused ? '#ef4444' : '#16a34a'}}>
          {status.job_paused ? '⏸' : '▶'} Job Search
        </span>
        <button
          onClick={() => toggle('job_search')}
          disabled={loading === 'job_search'}
          style={{
            padding: '2px 10px',
            borderRadius: '4px',
            border: '1px solid',
            borderColor: status.job_paused ? '#16a34a' : '#ef4444',
            background: 'transparent',
            color: status.job_paused ? '#16a34a' : '#ef4444',
            fontSize: '11px',
            cursor: loading === 'job_search' ? 'wait' : 'pointer',
            fontWeight: '600',
          }}
        >
          {loading === 'job_search' ? '...' : status.job_paused ? 'Resume' : 'Pause'}
        </button>
      </div>

      <span style={{
        marginLeft: 'auto',
        color: '#94a3b8',
        fontSize: '11px'
      }}>
        {status.abm_paused && status.job_paused
          ? 'All agents paused'
          : status.abm_paused
          ? 'ABM paused · Job search running'
          : status.job_paused
          ? 'ABM running · Job search paused'
          : 'All agents running'}
      </span>
    </div>
    {toast && (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: '#111827',
        color: '#ffffff',
        padding: '12px 20px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.2s ease',
      }}>
        {toast}
      </div>
    )}
    </>
  )
}
