import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function LogIn() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEmail = (val) => val.includes('@')

  const resolveEmail = async (identifier) => {
    if (isEmail(identifier)) return identifier
    // Look up email by username
    const username = identifier.startsWith('@') ? identifier.slice(1) : identifier
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username.toLowerCase())
      .single()
    if (error || !data) return null
    return data.email
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const email = await resolveEmail(identifier.trim())
    if (!email) {
      setError('No account found with that username.')
      setLoading(false)
      return
    }

    try {
      await signIn({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red" />

      <div className="mb-10 text-center">
        <Link to="/">
          <h1 className="text-4xl font-display font-bold tracking-widest uppercase">
            <span className="text-white">PERF</span>
            <span className="text-brand-red">PATH</span>
          </h1>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 animate-fadeInUp">
          <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
            Welcome Back
          </h2>
          <div className="w-8 h-0.5 bg-brand-red" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 animate-fadeInUp animate-delay-1">
          <div>
            <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
              Email or Username
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="you@example.com or @username"
              required
              className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-white/30 hover:text-brand-red font-body tracking-widest uppercase transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {error && (
            <div className="border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-brand-red text-sm font-body">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all disabled:opacity-50"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="mt-6 text-center text-white/30 text-sm font-body animate-fadeInUp animate-delay-2">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-red hover:text-red-400 transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  )
}
