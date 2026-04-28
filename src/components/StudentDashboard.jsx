import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'

const DEFAULT_GOALS = { total: 75, pediatric: 10, ecmo_vad: 5, cabg: 20, valve: 10, transplant: 5 }

function countByCategory(logs) {
  return {
    total: logs.length,
    pediatric: logs.filter(l => l.procedure_type === 'Pediatric Cardiac' || l.procedure_type === 'Congenital').length,
    ecmo_vad: logs.filter(l => l.procedure_type === 'ECMO' || l.procedure_type === 'VAD').length,
    cabg: logs.filter(l => l.procedure_type?.includes('CABG')).length,
    valve: logs.filter(l => l.procedure_type?.includes('Valve')).length,
    transplant: logs.filter(l => l.procedure_type?.includes('Transplant')).length,
  }
}

function getMotivation(total, goal) {
  const pct = total / goal
  if (total === 0) return 'Your path starts with the first case.'
  if (pct < 0.15) return 'Building the foundation. Stay consistent.'
  if (pct < 0.35) return 'Early momentum. Keep showing up.'
  if (pct < 0.5) return 'Making real progress. The work is adding up.'
  if (pct < 0.7) return 'Past the halfway point. Board certification is taking shape.'
  if (pct < 0.9) return 'The end is in sight. Finish strong.'
  if (total < goal) return `${goal - total} cases away from your goal.`
  return 'Board certification requirement met. Outstanding.'
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function AnimatedBar({ pct, delay = 0, color = 'bg-brand-red' }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100 + delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div className="w-full bg-navy h-1 overflow-hidden">
      <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${width}%` }} />
    </div>
  )
}

const OBJECTIVES = [
  { key: 'cabg', label: 'CABG', path: '/case-logger' },
  { key: 'pediatric', label: 'Pediatric', path: '/case-logger' },
  { key: 'valve', label: 'Valve', path: '/case-logger' },
  { key: 'ecmo_vad', label: 'ECMO / VAD', path: '/case-logger' },
  { key: 'transplant', label: 'Transplant', path: '/case-logger' },
]

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [loading, setLoading] = useState(true)
  const [streak, setStreak] = useState(0)
  const [showMilestoneEdit, setShowMilestoneEdit] = useState(false)
  const [milestoneGoal, setMilestoneGoal] = useState(75)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const [logsRes, profileRes] = await Promise.all([
      supabase.from('case_logs').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('profiles').select('case_goals').eq('id', user.id).single()
    ])
    if (logsRes.data) {
      setLogs(logsRes.data)
      setStreak(calcStreak(logsRes.data))
    }
    if (profileRes.data?.case_goals) {
      const g = { ...DEFAULT_GOALS, ...profileRes.data.case_goals }
      setGoals(g)
      setMilestoneGoal(g.total || 75)
    }
    setLoading(false)
  }

  const calcStreak = (logs) => {
    if (!logs.length) return 0
    const weeks = new Set(logs.map(l => {
      const d = new Date(l.date)
      const startOfWeek = new Date(d)
      startOfWeek.setDate(d.getDate() - d.getDay())
      return startOfWeek.toISOString().split('T')[0]
    }))
    const sorted = [...weeks].sort().reverse()
    let count = 0
    const now = new Date()
    for (const week of sorted) {
      const weekDate = new Date(week)
      const diffWeeks = Math.floor((now - weekDate) / (7 * 24 * 60 * 60 * 1000))
      if (diffWeeks === count) count++
      else break
    }
    return count
  }

  const saveMilestoneGoal = async () => {
    const newGoals = { ...goals, total: parseInt(milestoneGoal) || 75 }
    await supabase.from('profiles').update({ case_goals: newGoals }).eq('id', user.id)
    setGoals(newGoals)
    setShowMilestoneEdit(false)
  }

  const counts = countByCategory(logs)
  const totalPct = Math.min(100, Math.round((counts.total / goals.total) * 100))
  const recentLogs = logs.slice(0, 3)
  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-white/20 text-xs font-body tracking-widest uppercase animate-pulse">Initializing...</div>
    </div>
  )

  return (
    <div className="animate-fadeInUp">

      {/* Identity bar */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
            <span className="text-brand-red text-xs font-body tracking-widest uppercase">Student — Active</span>
          </div>
          <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white">
            {getGreeting()}, {firstName}
          </h2>
          <p className="text-white/25 text-xs font-body tracking-widest mt-1">{today}</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-display font-bold text-brand-red">{totalPct}%</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase">Board Readiness</div>
        </div>
      </div>

      {/* Motivation */}
      <div className="border-l-2 border-brand-red/50 pl-4 mb-6">
        <p className="text-white/50 text-sm font-body italic">{getMotivation(counts.total, goals.total)}</p>
      </div>

      {/* Quick actions — TOP */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => navigate('/case-logger?log=true')}
          className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs py-4 hover:bg-red-700 transition-all"
        >
          + Log Case
        </button>
        <button
          onClick={() => navigate('/case-logger')}
          className="bg-navy-light border border-white/10 text-white font-display font-semibold tracking-widest uppercase text-xs py-4 hover:border-white/30 transition-all"
        >
          View Cases
        </button>
        <button
          onClick={() => navigate('/protocols')}
          className="bg-navy-light border border-white/10 text-white font-display font-semibold tracking-widest uppercase text-xs py-4 hover:border-white/30 transition-all"
        >
          Protocols
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-navy-light border border-white/10 p-4 text-center">
          <div className="text-2xl font-display font-bold text-white">{counts.total}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Total Cases</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4 text-center">
          <div className="text-2xl font-display font-bold text-white">{streak}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Week Streak</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4 text-center">
          <div className="text-2xl font-display font-bold text-white">
            {[...new Set(logs.map(l => l.hospital))].length}
          </div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Hospitals</div>
        </div>
      </div>

      {/* Mission status */}
      <div className="bg-navy-light border border-white/10 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-body tracking-widest uppercase text-white/30">Mission Status</div>
          <div className="text-xs font-body tracking-widest uppercase text-brand-red">
            {counts.total} / {goals.total} Cases
          </div>
        </div>
        <div className="mb-5">
          <AnimatedBar pct={totalPct} delay={0} />
        </div>
        <div className="space-y-3">
          {OBJECTIVES.map((obj, i) => {
            const count = counts[obj.key]
            const goal = goals[obj.key]
            const pct = Math.min(100, Math.round((count / goal) * 100))
            const done = count >= goal
            return (
              <button key={obj.key} onClick={() => navigate(obj.path)} className="w-full text-left group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {done && <span className="text-green-400 text-xs">✓</span>}
                    <span className={`text-xs font-body tracking-widest uppercase ${done ? 'text-green-400/70' : 'text-white/40'} group-hover:text-white transition-colors`}>
                      {obj.label}
                    </span>
                  </div>
                  <span className={`text-xs font-body ${done ? 'text-green-400/70' : 'text-white/40'}`}>
                    {count} / {goal}
                  </span>
                </div>
                <AnimatedBar pct={pct} delay={i * 80} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Milestones — customizable */}
      <div className="border border-white/10 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-body tracking-widest uppercase text-white/30">Case Goal</div>
          <button
            onClick={() => setShowMilestoneEdit(!showMilestoneEdit)}
            className="text-xs text-white/20 hover:text-white font-body tracking-widest uppercase transition-colors"
          >
            {showMilestoneEdit ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {showMilestoneEdit ? (
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={milestoneGoal}
              onChange={e => setMilestoneGoal(e.target.value)}
              className="flex-1 bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
              placeholder="75"
            />
            <button
              onClick={saveMilestoneGoal}
              className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-red-700 transition-all"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            {[Math.round(goals.total * 0.33), Math.round(goals.total * 0.66), goals.total].map((milestone, i) => (
              <div key={milestone} className="flex items-center flex-1">
                <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all ${counts.total >= milestone ? 'bg-brand-red border-brand-red' : 'border-white/20 bg-transparent'}`} />
                <span className={`text-xs font-body ml-1 ${counts.total >= milestone ? 'text-brand-red' : 'text-white/20'}`}>{milestone}</span>
                {i < 2 && <div className="flex-1 h-px bg-white/10 mx-2" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent cases */}
      {recentLogs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/30 font-body tracking-widest uppercase">Recent Cases</div>
            <button onClick={() => navigate('/case-logger')} className="text-xs text-brand-red hover:text-red-400 font-body tracking-widest uppercase transition-colors">
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="bg-navy-light border border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {log.flagged && <span className="text-brand-red text-xs">⚑</span>}
                  <div>
                    <div className="text-white font-display font-semibold tracking-wider uppercase text-sm">{log.hospital}</div>
                    <div className="text-white/30 text-xs font-body">
                      {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-white/30 font-body hidden sm:block">{log.procedure_type}</div>
                  <div className="text-xs text-white/30 font-body">{log.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
