'use client'
import { SignIn } from "@clerk/nextjs"
import SahayakDemoBg from "@/components/sahayak-demo-bg"

export default function WelcomePage() {
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #0d1117 50%, #0a0f1e 100%)',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    }}>

      {/* Background */}
      <SahayakDemoBg />

      {/* LEFT COLUMN */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '50%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'10px',
            background:'linear-gradient(135deg, #14b8a6, #6366f1)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:'800', fontSize:'20px'
          }}>S</div>
          <span style={{color:'white', fontSize:'28px', fontWeight:'700'}}>Sahayak</span>
        </div>

        {/* Tagline */}
        <p style={{
          color:'rgba(255,255,255,0.5)',
          fontSize:'16px',
          marginBottom:'48px',
          margin:'0 0 48px 0'
        }}>
          Your outbound motion. Automated.
        </p>

        {/* Feature rows */}
        {[
          {icon:'🔍', title:'Finds companies matching your ICP', sub:'Scout agent searches 24/7 — no manual list building'},
          {icon:'✉️', title:'Writes emails that don\'t sound like AI', sub:'6-agent pipeline. Provenance check. Voice matching.'},
          {icon:'🧠', title:'Learns from every reply', sub:'Memory agent updates strategy after every outcome'},
        ].map((f, i) => (
          <div key={i} style={{
            display:'flex', gap:'16px', alignItems:'flex-start',
            marginBottom:'28px',
            animation:`fadeInUp 0.5s ease forwards`,
            animationDelay:`${i * 0.2}s`,
            opacity: 0,
          }}>
            <span style={{fontSize:'20px', marginTop:'2px'}}>{f.icon}</span>
            <div>
              <div style={{color:'white', fontWeight:'600', fontSize:'15px', marginBottom:'4px'}}>
                {f.title}
              </div>
              <div style={{color:'rgba(255,255,255,0.4)', fontSize:'13px'}}>
                {f.sub}
              </div>
            </div>
          </div>
        ))}

        {/* Live stat */}
        <div style={{
          marginTop:'16px',
          color:'rgba(255,255,255,0.3)',
          fontSize:'12px',
          display:'flex',
          alignItems:'center',
          gap:'8px'
        }}>
          <span style={{
            width:'6px', height:'6px', borderRadius:'50%',
            background:'#22c55e', display:'inline-block'
          }}/>
          Live · 47 accounts discovered · 12 emails sent · 3 replies
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '50%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '40px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
          boxSizing: 'border-box',
          overflow: 'hidden',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 80px)',
        }}>
          <p style={{
            color:'rgba(255,255,255,0.4)',
            fontSize:'13px',
            marginBottom:'24px',
            margin:'0 0 24px 0'
          }}>Welcome back</p>
          <SignIn
            routing="hash"
            appearance={{
              variables: {
                colorBackground: 'transparent',
                colorForeground: '#ffffff',
                colorPrimary: '#14b8a6',
                borderRadius: '8px',
              },
              elements: {
                rootBox: { width: '100%' },
                card: { background: 'transparent', boxShadow: 'none', padding: 0 },
                headerTitle: { color: '#ffffff' },
                headerSubtitle: { color: 'rgba(255,255,255,0.5)' },
                socialButtonsBlockButton: {
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                },
                formFieldInput: {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                },
                formButtonPrimary: {
                  background: '#14b8a6',
                  color: '#ffffff',
                },
                footer: { background: 'transparent' },
                footerAction: { color: 'rgba(255,255,255,0.4)' },
                footerActionLink: { color: '#14b8a6' },
              }
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
