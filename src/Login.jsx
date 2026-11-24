import { useState } from 'react'
import { supabase } from './supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import logo from './assets/logo.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isSignUp) {
      await supabase.auth.signUp({ email, password })
      alert('Account created! You can now log in.')
      setIsSignUp(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="login-unified-page">
      
      {/* UNIQUE TECH ANIMATION (Hologram Chip) */}
      <div className="hologram-container">
        <div className="holo-ring holo-ring-1"></div>
        <div className="holo-ring holo-ring-2"></div>
        
        <div className="circuit-line horizontal top"></div>
        <div className="circuit-line horizontal bottom"></div>
        <div className="circuit-line vertical left"></div>
        <div className="circuit-line vertical right"></div>

        <div className="data-particle" style={{ width: '6px', height: '6px', top: '80%', left: '20%' }}></div>
        <div className="data-particle" style={{ width: '8px', height: '8px', top: '70%', right: '10%', animationDelay: '1s' }}></div>
        <div className="data-particle" style={{ width: '4px', height: '4px', top: '90%', left: '60%', animationDelay: '2s' }}></div>

        <div className="holo-chip">
          <ShieldCheck size={35} color="#a3e635" />
        </div>
      </div>

      {/* FOREGROUND LOGIN CARD */}
      <div className="glass-login-card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={logo} alt="Infinite Logo" style={{ height: '50px', marginBottom: '15px', borderRadius: '8px' }} />
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="subtitle">{isSignUp ? 'Join to get your parts fast.' : 'Log in to access your student store.'}</p>
        </div>

        <form onSubmit={handleAuth}>
          <div className="glass-input-wrapper">
            <Mail size={18} />
            <input 
              type="email" 
              className="glass-input"
              placeholder="student@college.edu" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="glass-input-wrapper">
            <Lock size={18} />
            <input 
              type="password" 
              className="glass-input"
              placeholder="Password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="glass-btn" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ fontSize: '0.9rem', color: '#93c5fd', margin: 0 }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <span 
              onClick={() => setIsSignUp(!isSignUp)} 
              style={{ color: '#a3e635', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </span>
          </p>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
           <Link to="/" className="glass-link">← Back to Store</Link>
        </div>
      </div>

    </div>
  )
}