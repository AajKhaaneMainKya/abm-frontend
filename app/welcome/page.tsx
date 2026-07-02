'use client'
import { SignIn } from "@clerk/nextjs"

export default function WelcomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #0d1117 50%, #0a0f1e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box',
    }}>

      {/* Logo */}
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
        <div style={{
          width:'40px', height:'40px', borderRadius:'10px',
          background:'linear-gradient(135deg, #14b8a6, #6366f1)',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontWeight:'800', fontSize:'20px'
        }}>S</div>
        <span style={{color:'white', fontSize:'28px', fontWeight:'700'}}>Sahayak</span>
      </div>

      {/* Tagline */}
      <p style={{color:'rgba(255,255,255,0.5)', fontSize:'15px', margin:'0 0 32px 0', textAlign:'center'}}>
        Your outbound motion. Automated.
      </p>

      {/* Sign in card */}
      <div style={{
        width:'100%',
        maxWidth:'420px',
        background:'transparent',
        border:'none',
        borderRadius:'16px',
        padding:'32px',
        backdropFilter:'blur(20px)',
        boxShadow:'0 25px 50px rgba(0,0,0,0.5)',
        boxSizing:'border-box',
        marginBottom:'32px',
      }}>
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
              footerActionLink: { color: '#14b8a6' },
            }
          }}
        />
      </div>

      {/* Value props */}
      <div style={{
        display:'flex',
        gap:'24px',
        flexWrap:'wrap',
        justifyContent:'center',
        maxWidth:'600px',
      }}>
        {[
          {icon:'🔍', text:'Finds companies matching your ICP'},
          {icon:'✉️', text:'Writes emails that don\'t sound like AI'},
          {icon:'🧠', text:'Learns from every reply'},
        ].map((f, i) => (
          <div key={i} style={{
            display:'flex', alignItems:'center', gap:'8px',
            color:'rgba(255,255,255,0.35)', fontSize:'13px',
          }}>
            <span>{f.icon}</span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>

      <style>{`
        .cl-lastAuthenticationStrategyBadge { display: none !important; }
        .cl-internal-fxb5iq { display: none !important; }
      `}</style>
    </div>
  )
}
