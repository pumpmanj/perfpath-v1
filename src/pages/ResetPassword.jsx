import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
      else setError('Invalid or expired reset link. Please request a new one.')
    })
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6">
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red" />

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-display font-bold tracking-widest uppercase">
          <span className="text-white">PERF</span>
          <span className="text-brand-red">PATH</span>
        </h1>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 animate-fadeInUp">
          <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
            New Password
          </h2>
          <div className="w-8 h-0.5 bg-brand-red" />
        </div>

        {!ready ? (
          <div className="border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-brand-red text-sm font-body">
            {error || 'Verifying reset link...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 animate-fadeInUp animate-delay-1">
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Confirm new password"
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
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
