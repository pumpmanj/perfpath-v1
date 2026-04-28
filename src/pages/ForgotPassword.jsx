import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      setError('Something went wrong. Please try again.')
    } else {
      setSent(true)
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
        {sent ? (
          <div className="animate-fadeInUp text-center">
            <div className="w-12 h-12 rounded-full bg-brand-red/20 border border-brand-red/50 flex items-center justify-center mx-auto mb-4">
              <span className="text-brand-red text-lg">✓</span>
            </div>
            <h2 className="text-2xl font-display font-semibold tracking-wider uppercase text-white mb-2">
              Check Your Email
            </h2>
            <div className="w-8 h-0.5 bg-brand-red mx-auto mb-4" />
            <p className="text-white/40 font-body text-sm leading-relaxed mb-6">
              We sent a password reset link to <span className="text-white">{email}</span>
            </p>
            <Link to="/login" className="text-brand-red text-xs font-body tracking-widest uppercase hover:text-red-400 transition-colors">
              Back to Log In
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 animate-fadeInUp">
              <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
                Reset Password
              </h2>
              <div className="w-8 h-0.5 bg-brand-red" />
              <p className="text-white/40 font-body text-sm mt-3">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fadeInUp animate-delay-1">
              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-6 text-center text-white/30 text-sm font-body animate-fadeInUp animate-delay-2">
              <Link to="/login" className="text-brand-red hover:text-red-400 transition-colors">
                Back to Log In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
