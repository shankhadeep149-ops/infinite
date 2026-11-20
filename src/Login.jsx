import { useState } from 'react'
import { supabase } from './supabase'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const navigate = useNavigate()

  const handleAuth = async (e) => {
    e.preventDefault()
    if (isSignUp) {
      await supabase.auth.signUp({ email, password })
      alert('Account created! You can now log in.')
      setIsSignUp(false)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
      else navigate('/')
    }
  }

  return (
    <div className="app-container">
      <div className="auth-card">
        {/* Updated to Infinite branding */}
        <h2>Infinite: {isSignUp ? 'Sign Up' : 'Log In'}</h2>
        <form onSubmit={handleAuth}>
          <input type="email" placeholder="student@college.edu" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" className="btn-primary">{isSignUp ? 'Sign Up' : 'Continue'}</button>
        </form>
        <p className="auth-toggle" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </p>
        <Link to="/" className="back-link">Back to Infinite Store</Link>
      </div>
    </div>
  )
}