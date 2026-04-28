import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const STAGE_LABELS = {
  pre_applicant: 'Pre-Applicant',
  student: 'Student',
  ccp: 'Certified CCP',
}

const PRIMARY_TOOLS = {
  pre_applicant: [
    { id: 'shadow-tracker', label: 'Shadow Tracker', path: '/shadow-tracker', icon: '◈' },
    { id: 'programs', label: 'Program Directory', path: '/programs', icon: '◉' },
  ],
  student: [
    { id: 'case-logger', label: 'Case Logger', path: '/case-logger', icon: '⊕' },
    { id: 'protocols', label: 'Protocol Library', path: '/protocols', icon: '≡' },
  ],
  ccp: [
    { id: 'case-logger', label: 'Case Logger', path: '/case-logger', icon: '⊕' },
    { id: 'protocols', label: 'Protocol Library', path: '/protocols', icon: '≡' },
  ],
}

const SECONDARY_TOOLS = {
  pre_applicant: [
    { id: 'protocols', label: 'Protocol Library', path: '/protocols', icon: '≡', soon: false },
    { id: 'hospitals', label: 'Hospital Directory', path: '/hospitals', icon: '◆', soon: false },
  ],
  student: [
    { id: 'shadow-tracker', label: 'Shadow Tracker', path: '/shadow-tracker', icon: '◈', soon: false },
    { id: 'programs', label: 'Program Directory', path: '/programs', icon: '◉', soon: false },
    { id: 'hospitals', label: 'Hospital Directory', path: '/hospitals', icon: '◆', soon: false },
  ],
  ccp: [
    { id: 'programs', label: 'Program Directory', path: '/programs', icon: '◉', soon: false },
    { id: 'hospitals', label: 'Hospital Directory', path: '/hospitals', icon: '◆', soon: false },
    { id: 'salary', label: 'Salary Tracker', path: '/salary', icon: '◐', soon: true },
  ],
}

function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function formatMilitary(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

export default function Sidebar({ onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, signOut } = useAuth()
  const sidebarRef = useRef(null)
  const now = useClock()
  const [moreOpen, setMoreOpen] = useState(false)

  const userType = profile?.user_type || 'pre_applicant'
  const primaryTools = PRIMARY_TOOLS[userType] || PRIMARY_TOOLS.pre_applicant
  const secondaryTools = SECONDARY_TOOLS[userType] || SECONDARY_TOOLS.pre_applicant

  useEffect(() => {
    const handleClick = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleNav = (path, soon) => {
    if (soon) return
    navigate(path)
    onClose()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const currentPath = '/' + location.pathname.split('/')[1]

  // Auto-open More if current page is a secondary tool
  useEffect(() => {
    const isSecondary = secondaryTools.some(t => currentPath === t.path)
    if (isSecondary) setMoreOpen(true)
  }, [currentPath])

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" />

      <div
        ref={sidebarRef}
        className="fixed top-0 left-0 h-full w-64 bg-navy-dark border-r border-white/10 z-50 flex flex-col animate-slideIn"
      >
        <div className="h-1 bg-brand-red w-full" />

        {/* Header */}
        <div className="px-5 pt-4 pb-4 flex items-center justify-between">
          <h1 className="text-xl font-display font-bold tracking-widest uppercase">
            <span className="text-white">PERF</span>
            <span className="text-brand-red">PATH</span>
          </h1>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors text-base">
            ✕
          </button>
        </div>

        {/* Profile */}
        <div className="px-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
              <span className="text-white font-display font-bold text-xs">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-white font-body text-sm font-medium truncate">{profile?.full_name}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-1 rounded-full bg-brand-red flex-shrink-0" />
                <span className="text-xs text-white/40 font-body tracking-widest uppercase">
                  {STAGE_LABELS[userType] || 'Member'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-white/50 font-display font-bold text-sm tracking-widest tabular-nums">
              {formatMilitary(now)}
            </span>
            <span className="text-white/20 font-body text-xs tracking-wider">
              {formatDate(now)}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-2">

          {/* Dashboard */}
          <button
            onClick={() => handleNav('/dashboard', false)}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all border-l-2 ${
              currentPath === '/dashboard'
                ? 'border-brand-red bg-brand-red/10 text-white'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`text-xs ${currentPath === '/dashboard' ? 'text-brand-red' : 'text-white/25'}`}>⊞</span>
            <span className="font-display font-semibold tracking-wider uppercase text-xs">Dashboard</span>
          </button>

          <div className="h-px bg-white/8 my-1" />

          {/* Primary tools — prominent */}
          <div className="space-y-2 py-1">
            {primaryTools.map(item => {
              const isActive = currentPath === item.path
              return (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.path, false)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all border ${
                    isActive
                      ? 'border-brand-red bg-brand-red/15 text-white'
                      : 'border-white/10 text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`text-sm flex-shrink-0 ${isActive ? 'text-brand-red' : 'text-white/40'}`}>
                    {item.icon}
                  </span>
                  <span className="font-display font-semibold tracking-wider uppercase text-xs">
                    {item.label}
                  </span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-red" />}
                </button>
              )
            })}
          </div>

          {/* More tools — collapsible */}
          {secondaryTools.length > 0 && (
            <div>
              <button
                onClick={() => setMoreOpen(!moreOpen)}
                className="w-full text-left px-3 py-2 flex items-center justify-between text-white/25 hover:text-white/50 transition-colors"
              >
                <span className="font-body text-xs tracking-widest uppercase">More Tools</span>
                <span className="text-xs transition-transform duration-200" style={{ transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▾
                </span>
              </button>

              {moreOpen && (
                <div className="space-y-0.5 animate-fadeInUp">
                  {secondaryTools.map(item => {
                    const isActive = currentPath === item.path
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNav(item.path, item.soon)}
                        disabled={item.soon}
                        className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all border-l-2 ${
                          isActive
                            ? 'border-brand-red bg-brand-red/10 text-white'
                            : item.soon
                            ? 'border-transparent text-white/15 cursor-not-allowed'
                            : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span className={`text-xs ${isActive ? 'text-brand-red' : item.soon ? 'text-white/10' : 'text-white/25'}`}>
                          {item.icon}
                        </span>
                        <span className="font-display font-semibold tracking-wider uppercase text-xs flex-1">
                          {item.label}
                        </span>
                        {item.soon && (
                          <span className="text-xs font-body text-white/15 border border-white/10 px-1.5 py-0.5">
                            Soon
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="h-px bg-white/8 my-1" />

          {/* Settings */}
          <button
            onClick={() => handleNav('/settings', false)}
            className={`w-full text-left px-3 py-2.5 flex items-center gap-3 transition-all border-l-2 ${
              currentPath === '/settings'
                ? 'border-brand-red bg-brand-red/10 text-white'
                : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className={`text-xs ${currentPath === '/settings' ? 'text-brand-red' : 'text-white/25'}`}>○</span>
            <span className="font-display font-semibold tracking-wider uppercase text-xs">Settings</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <button
            onClick={() => { signOut(); onClose() }}
            className="text-white/20 hover:text-white/50 font-body text-xs tracking-widest uppercase transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
