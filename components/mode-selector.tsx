'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'abm' | 'job_search'

const STORAGE_KEY = 'sahayak_mode'
const SKIP_KEY = 'sahayak_mode_skip'

export function useMode() {
  const [mode, setModeState] = useState<Mode>('abm')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Mode
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate mode from localStorage on mount
    if (stored) setModeState(stored)
  }, [])

  const setMode = (m: Mode) => {
    setModeState(m)
    localStorage.setItem(STORAGE_KEY, m)
  }

  return { mode, setMode }
}

export default function ModeSelector({ onSelect }: { onSelect: (m: Mode) => void }) {
  const [selected, setSelected] = useState<Mode | null>(null)
  const [dontAsk, setDontAsk] = useState(false)

  const confirm = () => {
    if (!selected) return
    localStorage.setItem(STORAGE_KEY, selected)
    if (dontAsk) localStorage.setItem(SKIP_KEY, 'true')
    onSelect(selected)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
          <div style={{
            width:'32px', height:'32px', borderRadius:'8px',
            background:'linear-gradient(135deg, #14b8a6, #6366f1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:'800', fontSize:'16px'
          }}>S</div>
          <span style={{fontWeight:'700', fontSize:'18px', color:'#111827'}}>Sahayak</span>
        </div>

        <p style={{color:'#6b7280', fontSize:'14px', marginBottom:'28px', margin:'0 0 28px 0'}}>
          What are you using Sahayak for?
        </p>

        {/* Options */}
        {([
          {
            value: 'abm' as Mode,
            icon: '🎯',
            title: 'ABM Campaigns',
            desc: 'Find companies, enrich contacts, send personalised outreach',
          },
          {
            value: 'job_search' as Mode,
            icon: '💼',
            title: 'Job Search',
            desc: 'Target founders, send warm outreach, track replies',
          },
        ] as const).map((opt) => (
          <div
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            style={{
              border: `2px solid ${selected === opt.value ? '#0f766e' : '#e5e7eb'}`,
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              background: selected === opt.value ? '#f0fdfa' : '#ffffff',
              transition: 'all 0.15s',
              display: 'flex',
              gap: '14px',
              alignItems: 'flex-start',
            }}
          >
            <span style={{fontSize:'24px'}}>{opt.icon}</span>
            <div>
              <div style={{fontWeight:'600', fontSize:'14px', color:'#111827', marginBottom:'2px'}}>
                {opt.title}
              </div>
              <div style={{fontSize:'13px', color:'#6b7280'}}>
                {opt.desc}
              </div>
            </div>
          </div>
        ))}

        {/* Don't ask again */}
        <label style={{
          display:'flex', alignItems:'center', gap:'8px',
          fontSize:'13px', color:'#6b7280', cursor:'pointer',
          marginBottom:'20px', marginTop:'4px',
        }}>
          <input
            type="checkbox"
            checked={dontAsk}
            onChange={e => setDontAsk(e.target.checked)}
            style={{accentColor:'#0f766e'}}
          />
          Don&apos;t ask me again
        </label>

        {/* Confirm button */}
        <button
          onClick={confirm}
          disabled={!selected}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            background: selected ? '#0f766e' : '#e5e7eb',
            color: selected ? '#ffffff' : '#9ca3af',
            fontWeight: '600',
            fontSize: '14px',
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          {selected ? `Continue with ${selected === 'abm' ? 'ABM Campaigns' : 'Job Search'} →` : 'Select an option'}
        </button>

        {/* Already have a preference link */}
        <p style={{textAlign:'center', marginTop:'16px', fontSize:'12px', color:'#9ca3af'}}>
          You can switch modes anytime from the sidebar
        </p>
      </div>
    </div>
  )
}
