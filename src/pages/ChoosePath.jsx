import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const paths = [
  {
    id: 'pre_applicant',
    label: 'Pre-Applicant',
    headline: 'Exploring Perfusion',
    description: "I'm building shadow hours and preparing my application to a perfusion program.",
    icon: '◈',
    detail: 'Shadow Tracker • Program Research • CCP Finder',
  },
  {
    id: 'student',
    label: 'Student',
    headline: 'In the Program',
    description: "I'm enrolled in an accredited perfusion program and logging clinical cases.",
    icon: '◉',
    detail: 'Case Logger • Board Prep • Progress Tracking',
  },
  {
    id: 'ccp',
    label: 'Certified CCP',
    headline: 'Practicing Perfusionist',
    description: "I'm a certified perfusionist managing my career, CEUs, and recertification.",
    icon: '◆',
    detail: 'CEU Tracker • Hospital Directory • CCP Hub',
  },
]

export default function ChoosePath() {
  const navigate = useNavigate()
  const { updateUserType } = useAuth()
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      await updateUserType(selected)
      navigate('/dashboard')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-12">

      {/* Red top bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red" />

      {/* Logo */}
      <div className="mb-12 text-center animate-fadeInUp">
        <h1 className="text-3xl font-display font-bold tracking-widest uppercase mb-4">
          <span className="text-white">PERF</span>
          <span className="text-brand-red">PATH</span>
        </h1>
        <h2 className="text-2xl md:text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
          Choose Your Path
        </h2>
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-px bg-brand-red" />
          <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
          <div className="w-8 h-px bg-brand-red" />
        </div>
        <p className="mt-4 text-white/40 text-xs font-body tracking-widest uppercase">
          Select your current stage. You can update this anytime.
        </p>
      </div>

      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {paths.map((path, i) => (
          <button
            key={path.id}
            onClick={() => setSelected(path.id)}
            className={`
              relative text-left p-6 border transition-all duration-200 card-hover
              animate-fadeInUp
              ${i === 0 ? 'animate-delay-1' : i === 1 ? 'animate-delay-2' : 'animate-delay-3'}
              ${selected === path.id
                ? 'border-brand-red bg-brand-red/10'
                : 'border-white/10 bg-navy-light hover:border-white/30'
              }
            `}
          >
            {/* Selected indicator */}
            {selected === path.id && (
              <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand-red" />
            )}

            {/* Icon */}
            <div className={`text-2xl mb-4 ${selected === path.id ? 'text-brand-red' : 'text-white/20'}`}>
              {path.icon}
            </div>

            {/* Label */}
            <div className={`text-xs font-body font-medium tracking-widest uppercase mb-1 ${selected === path.id ? 'text-brand-red' : 'text-white/40'}`}>
              {path.label}
            </div>

            {/* Headline */}
            <h3 className="text-xl font-display font-semibold tracking-wider uppercase text-white mb-3">
              {path.headline}
            </h3>

            {/* Description */}
            <p className="text-white/50 text-sm font-body leading-relaxed mb-4">
              {path.description}
            </p>

            {/* Features */}
            <div className={`text-xs font-body tracking-wide border-t pt-4 ${selected === path.id ? 'border-brand-red/30 text-brand-red/70' : 'border-white/10 text-white/25'}`}>
              {path.detail}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-brand-red text-sm font-body">
          {error}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        disabled={!selected || loading}
        className="px-16 py-4 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-sm hover:bg-red-700 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105"
      >
        {loading ? 'Setting Your Path...' : 'Begin'}
      </button>
    </div>
  )
}
