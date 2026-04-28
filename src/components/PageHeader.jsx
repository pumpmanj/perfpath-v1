import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const STAGE_TOOLS = {
  pre_applicant: [
    { id: 'shadow-tracker', label: 'Shadow Tracker', path: '/shadow-tracker' },
    { id: 'programs', label: 'Program Directory', path: '/programs' },
    { id: 'protocols', label: 'Protocol Library', path: '/protocols' },
    { id: 'hospitals', label: 'Hospital Directory', path: '/hospitals' },
  ],
  student: [
    { id: 'case-logger', label: 'Case Logger', path: '/case-logger' },
    { id: 'protocols', label: 'Protocol Library', path: '/protocols' },
    { id: 'shadow-tracker', label: 'Shadow Tracker', path: '/shadow-tracker' },
    { id: 'hospitals', label: 'Hospital Directory', path: '/hospitals' },
  ],
  ccp: [
    { id: 'case-logger', label: 'Case Logger', path: '/case-logger' },
    { id: 'protocols', label: 'Protocol Library', path: '/protocols' },
    { id: 'hospitals', label: 'Hospital Directory', path: '/hospitals' },
  ],
}

export default function PageHeader({ title, currentId }) {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const tools = STAGE_TOOLS[profile?.user_type] || STAGE_TOOLS.pre_applicant
  const currentIndex = tools.findIndex(t => t.id === currentId)
  const prev = currentIndex > 0 ? tools[currentIndex - 1] : null
  const next = currentIndex < tools.length - 1 ? tools[currentIndex + 1] : null

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors"
        >
          Dashboard
        </button>
        <span className="text-white/15 text-xs">›</span>
        <span className="text-xs text-white/60 font-body tracking-widest uppercase">{title}</span>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white mb-2">
        {title}
      </h2>
      <div className="w-8 h-0.5 bg-brand-red" />

      {/* Quick nav tabs */}
      {(prev || next) && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          {prev && (
            <button
              onClick={() => navigate(prev.path)}
              className="flex items-center gap-2 text-xs font-body tracking-widest uppercase px-3 py-1.5 border border-white/10 text-white/30 hover:border-white/30 hover:text-white transition-all"
            >
              ← {prev.label}
            </button>
          )}
          <div className="flex-1" />
          {next && (
            <button
              onClick={() => navigate(next.path)}
              className="flex items-center gap-2 text-xs font-body tracking-widest uppercase px-3 py-1.5 border border-white/10 text-white/30 hover:border-white/30 hover:text-white transition-all"
            >
              {next.label} →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
