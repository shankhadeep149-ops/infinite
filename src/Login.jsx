import { useState } from 'react'
import { supabase } from './supabase'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
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
    <div className="login-split">
      
      {/* LEFT SIDE: ANIMATED GRAPHIC */}
      <div className="login-left">
        <div className="animated-tech-graphic">
          {/* Abstract Circuit Graphic */}
          <div className="circuit-line" style={{ top: '20%', left: '10%', width: '80%', height: '4px' }}></div>
          <div className="circuit-line" style={{ top: '50%', left: '0%', width: '100%', height: '4px', animationDelay: '0.5s' }}></div>
          <div className="circuit-line" style={{ top: '80%', left: '20%', width: '60%', height: '4px', animationDelay: '1s' }}></div>
          
          <div className="circuit-line" style={{ top: '20%', left: '20%', width: '4px', height: '60%' }}></div>
          <div className="circuit-line" style={{ top: '10%', left: '70%', width: '4px', height: '80%', animationDelay: '0.3s' }}></div>
          
          {/* Central Glowing Chip */}
          <div style={{ position: 'absolute', top: '40%', left: '40%', width: '50px', height: '50px', background: '#0a1128', border: '3px solid #a3e635', borderRadius: '10px', boxShadow: '0 0 20px #a3e635', zIndex: 2 }}></div>
          
          <h2 style={{ position: 'absolute', top: '60%', width: '100%', textAlign: 'center', color: 'white', fontWeight: 'bold', letterSpacing: '2px' }}>INFINITE</h2>
          <p style={{ position: 'absolute', top: '68%', width: '100%', textAlign: 'center', color: '#a3e635', fontSize: '0.8rem' }}>Build More. Wait Less.</p>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="login-right">
        <div className="login-form-box">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img src={logo} alt="Infinite Logo" style={{ height: '50px', marginBottom: '10px' }} />
            <h2 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.8rem' }}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p style={{ color: '#666', marginTop: '5px' }}>{isSignUp ? 'Join Infinite to get your project parts fast.' : 'Log in to access your student store.'}</p>
          </div>

          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: '15px', position: 'relative' }}>
              <Mail size={18} color="#999" style={{ position: 'absolute', top: '14px', left: '12px' }} />
              <input 
                type="email" 
                placeholder="student@college.edu" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <Lock size={18} color="#999" style={{ position: 'absolute', top: '14px', left: '12px' }} />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '14px', fontSize: '1rem', background: '#1e3a8a' }}>
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#1e3a8a', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}>
              {isSignUp ? 'Log In' : 'Sign Up'}
            </span>
          </p>
          
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
             <Link to="/" style={{ color: '#999', textDecoration: 'none', fontSize: '0.85rem' }}>← Back to Store</Link>
          </div>
        </div>
      </div>

    </div>
  )
}