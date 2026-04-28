import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()

  // Step 1 — invite code, Step 2 — account details
  const [step, setStep] = useState(1)
  const [inviteCode, setInviteCode] = useState('')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, active')
      .eq('code', inviteCode.trim().toUpperCase())
      .single()

    if (error || !data) {
      setError('Invalid invite code. Please check and try again.')
    } else if (!data.active) {
      setError('This invite code is no longer active.')
    } else {
      setStep(2)
    }
    setLoading(false)
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      await signUp({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        userType: null,
      })
      navigate('/choose-path')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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

        {step === 1 ? (
          <>
            <div className="mb-8 animate-fadeInUp">
              <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
                Early Access
              </h2>
              <div className="w-8 h-0.5 bg-brand-red mb-3" />
              <p className="text-white/40 text-sm font-body leading-relaxed">
                PerfPath is currently invite-only. Enter your access code to continue.
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-5 animate-fadeInUp animate-delay-1">
              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                  Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Enter your invite code"
                  required
                  autoCapitalize="characters"
                  className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors tracking-widest uppercase"
                />
              </div>

              {error && (
                <div className="border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-brand-red text-sm font-body">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !inviteCode}
                className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </form>

            <p className="mt-6 text-center text-white/30 text-sm font-body animate-fadeInUp animate-delay-2">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-red hover:text-red-400 transition-colors">
                Log In
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="mb-8 animate-fadeInUp">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
                <span className="text-xs text-brand-red font-body tracking-widest uppercase">Code Verified</span>
              </div>
              <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
                Create Account
              </h2>
              <div className="w-8 h-0.5 bg-brand-red" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fadeInUp animate-delay-1">
              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-navy-light border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
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
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
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
                className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Continue'}
              </button>
            </form>

            <p className="mt-4 text-center animate-fadeInUp animate-delay-2">
              <button
                onClick={() => { setStep(1); setError('') }}
                className="text-white/20 hover:text-white/40 text-xs font-body tracking-widest uppercase transition-colors"
              >
                ← Back
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
