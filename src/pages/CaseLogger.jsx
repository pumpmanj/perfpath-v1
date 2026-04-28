import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import HeartLoader from '../components/HeartLoader'
import PageHeader from '../components/PageHeader'

// ─── Constants ───────────────────────────────────────────────────────────────

const PROCEDURE_TYPES = [
  'CABG',
  'Valve Replacement',
  'CABG + Valve',
  'Aortic Surgery',
  'Heart Transplant',
  'Lung Transplant',
  'Pediatric Cardiac',
  'ECMO',
  'VAD',
  'Off-Pump CABG',
  'Congenital',
  'Other',
]

const ROLES = ['Primary Perfusionist', 'Assistant', 'Observer']

const PUMP_TYPES = ['Centrifugal', 'Roller', 'Both', 'N/A']

const DEFAULT_GOALS = {
  total: 75,
  pediatric: 10,
  ecmo_vad: 5,
  cabg: 20,
  valve: 10,
  transplant: 5,
}

const GOAL_LABELS = {
  total: 'Total Cases',
  pediatric: 'Pediatric',
  ecmo_vad: 'ECMO / VAD',
  cabg: 'CABG',
  valve: 'Valve',
  transplant: 'Transplant',
}

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  hospital: '',
  procedure_type: '',
  procedure_type_other: '',
  role: 'Primary Perfusionist',
  bypass_time: '',
  cross_clamp_time: '',
  oxygenator: '',
  pump_type: '',
  surgeon: '',
  perfusionist: '',
  notes: '',
  flagged: false,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function countByCategory(logs) {
  return {
    total: logs.length,
    pediatric: logs.filter(l => l.procedure_type === 'Pediatric Cardiac' || l.procedure_type === 'Congenital').length,
    ecmo_vad: logs.filter(l => l.procedure_type === 'ECMO' || l.procedure_type === 'VAD').length,
    cabg: logs.filter(l => l.procedure_type?.includes('CABG')).length,
    valve: logs.filter(l => l.procedure_type?.includes('Valve') || l.procedure_type?.includes('CABG + Valve')).length,
    transplant: logs.filter(l => l.procedure_type?.includes('Transplant')).length,
  }
}

function ProgressBar({ value, goal, color = '#C0392B' }) {
  const pct = Math.min(100, Math.round((value / goal) * 100))
  const done = value >= goal
  return (
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: done ? '#22c55e' : color }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CaseLogger() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const location = useLocation()

  const [logs, setLogs] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [expandedLog, setExpandedLog] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [showGoals, setShowGoals] = useState(false)
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [goalsForm, setGoalsForm] = useState(DEFAULT_GOALS)

  // Filters
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterFlagged, setFilterFlagged] = useState(false)
  const [sortBy, setSortBy] = useState('date_desc')

  useEffect(() => {
    fetchLogs()
    loadGoals()
    const params = new URLSearchParams(location.search)
    if (params.get('log') === 'true') setShowForm(true)
  }, [])

  const fetchLogs = async () => {
    setFetching(true)
    const { data } = await supabase
      .from('case_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (data) setLogs(data)
    setFetching(false)
  }

  const loadGoals = () => {
    try {
      const saved = localStorage.getItem(`perfpath_case_goals_${user.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setGoals(parsed)
        setGoalsForm(parsed)
      }
    } catch {}
  }

  const saveGoals = () => {
    localStorage.setItem(`perfpath_case_goals_${user.id}`, JSON.stringify(goalsForm))
    setGoals(goalsForm)
    setShowGoals(false)
    addToast('Goals updated')
  }

  // ─── Derived stats ──────────────────────────────────────────────────────────

  const counts = useMemo(() => countByCategory(logs), [logs])
  const flaggedCount = logs.filter(l => l.flagged).length
  const uniqueHospitals = [...new Set(logs.map(l => l.hospital).filter(Boolean))]

  const filteredLogs = useMemo(() => {
    let result = [...logs]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.hospital?.toLowerCase().includes(q) ||
        l.procedure_type?.toLowerCase().includes(q) ||
        l.surgeon?.toLowerCase().includes(q) ||
        l.perfusionist?.toLowerCase().includes(q) ||
        l.oxygenator?.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q)
      )
    }
    if (filterType) result = result.filter(l => l.procedure_type === filterType)
    if (filterRole) result = result.filter(l => l.role === filterRole)
    if (filterFlagged) result = result.filter(l => l.flagged)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.date) - new Date(a.date)
        case 'date_asc': return new Date(a.date) - new Date(b.date)
        case 'hospital': return (a.hospital || '').localeCompare(b.hospital || '')
        case 'procedure': return (a.procedure_type || '').localeCompare(b.procedure_type || '')
        default: return 0
      }
    })
    return result
  }, [logs, search, filterType, filterRole, filterFlagged, sortBy])

  const activeFilterCount = [search, filterType, filterRole, filterFlagged].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setFilterType('')
    setFilterRole('')
    setFilterFlagged(false)
    setSortBy('date_desc')
  }

  // ─── Form handlers ──────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleEdit = (log) => {
    setEditId(log.id)
    setForm({
      date: log.date,
      hospital: log.hospital || '',
      procedure_type: PROCEDURE_TYPES.includes(log.procedure_type) ? log.procedure_type : 'Other',
      procedure_type_other: PROCEDURE_TYPES.includes(log.procedure_type) ? '' : log.procedure_type || '',
      role: log.role || 'Primary Perfusionist',
      bypass_time: log.bypass_time || '',
      cross_clamp_time: log.cross_clamp_time || '',
      oxygenator: log.oxygenator || '',
      pump_type: log.pump_type || '',
      surgeon: log.surgeon || '',
      perfusionist: log.perfusionist || '',
      notes: log.notes || '',
      flagged: log.flagged || false,
    })
    setShowForm(true)
    setExpandedLog(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      date: form.date,
      hospital: form.hospital,
      procedure_type: form.procedure_type === 'Other' ? form.procedure_type_other : form.procedure_type,
      role: form.role,
      bypass_time: form.bypass_time ? parseInt(form.bypass_time) : null,
      cross_clamp_time: form.cross_clamp_time ? parseInt(form.cross_clamp_time) : null,
      oxygenator: form.oxygenator,
      pump_type: form.pump_type,
      surgeon: form.surgeon,
      perfusionist: form.perfusionist,
      notes: form.notes,
      flagged: form.flagged,
    }

    if (editId) {
      const { error } = await supabase.from('case_logs').update(payload).eq('id', editId)
      if (error) {
        setError('Something went wrong. Please try again.')
      } else {
        setForm(emptyForm); setShowForm(false); setEditId(null)
        fetchLogs(); addToast('Case updated')
      }
    } else {
      const { error } = await supabase.from('case_logs').insert({ ...payload, user_id: user.id })
      if (error) {
        setError('Something went wrong. Please try again.')
      } else {
        setForm(emptyForm); setShowForm(false)
        fetchLogs(); addToast('Case logged')
      }
    }
    setLoading(false)
  }

  const handleFlag = async (e, log) => {
    e.stopPropagation()
    const { error } = await supabase
      .from('case_logs')
      .update({ flagged: !log.flagged })
      .eq('id', log.id)
    if (!error) {
      setLogs(prev => prev.map(l => l.id === log.id ? { ...l, flagged: !l.flagged } : l))
      addToast(log.flagged ? 'Flag removed' : 'Case flagged')
    }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    await supabase.from('case_logs').delete().eq('id', confirmId)
    setConfirmId(null)
    fetchLogs()
    addToast('Case deleted')
  }

  const cancelForm = () => {
    setShowForm(false); setEditId(null); setForm(emptyForm); setError('')
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <HeartLoader size={72} text="Loading cases..." />
      </div>
    )
  }

  return (
    <div className="animate-fadeInUp">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <PageHeader title="Case Logger" currentId="case-logger" />
        <div className="flex items-center gap-2 mt-8 flex-shrink-0">
          <button
            onClick={() => { setShowGoals(true); setGoalsForm(goals) }}
            className="text-xs font-body tracking-widest uppercase text-white/30 hover:text-white transition-colors border border-white/10 px-3 py-2"
          >
            Edit Goals
          </button>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}
            className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-red-700 transition-all"
          >
            + Log Case
          </button>
        </div>
      </div>

      {/* Goals editor modal */}
      {showGoals && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-navy-dark border border-white/10 w-full max-w-md">
            <div className="h-1 bg-brand-red" />
            <div className="p-6">
              <h3 className="font-display font-bold tracking-wider uppercase text-white mb-1">Case Goals</h3>
              <p className="text-white/30 text-xs font-body mb-5">ABCP standard defaults. Edit to match your program requirements.</p>
              <div className="space-y-3">
                {Object.entries(GOAL_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <label className="text-sm text-white/60 font-body flex-1">{label}</label>
                    <input
                      type="number"
                      min="1"
                      value={goalsForm[key]}
                      onChange={e => setGoalsForm(prev => ({ ...prev, [key]: parseInt(e.target.value) || 1 }))}
                      className="w-20 bg-navy border border-white/10 text-white text-center px-2 py-1.5 font-body text-sm focus:outline-none focus:border-brand-red"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={saveGoals} className="flex-1 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs py-2.5 hover:bg-red-700 transition-all">
                  Save Goals
                </button>
                <button onClick={() => setShowGoals(false)} className="flex-1 border border-white/10 text-white/40 hover:text-white font-body text-xs tracking-widest uppercase py-2.5 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log form */}
      {showForm && (
        <div className="bg-navy-light border border-white/10 mb-6 overflow-hidden">
          <div className="h-1 bg-brand-red" />
          <div className="p-6">
            <h3 className="font-display font-bold tracking-wider uppercase text-white mb-5">
              {editId ? 'Edit Case' : 'Log New Case'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                {/* Date */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Date *</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required
                    className="w-full bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>

                {/* Hospital */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Hospital *</label>
                  <input type="text" name="hospital" value={form.hospital} onChange={handleChange} required placeholder="e.g. Upstate University Hospital"
                    className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>

                {/* Procedure type */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Procedure Type *</label>
                  <select name="procedure_type" value={form.procedure_type} onChange={handleChange} required
                    className="w-full bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
                    <option value="">Select type...</option>
                    {PROCEDURE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Other procedure */}
                {form.procedure_type === 'Other' && (
                  <div>
                    <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Specify Procedure *</label>
                    <input type="text" name="procedure_type_other" value={form.procedure_type_other} onChange={handleChange} required placeholder="Describe procedure"
                      className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                  </div>
                )}

                {/* Role */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Your Role *</label>
                  <select name="role" value={form.role} onChange={handleChange} required
                    className="w-full bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Bypass time */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Bypass Time (min)</label>
                  <input type="number" name="bypass_time" value={form.bypass_time} onChange={handleChange} placeholder="e.g. 95" min="0"
                    className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>

                {/* Cross clamp time */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Cross-Clamp Time (min)</label>
                  <input type="number" name="cross_clamp_time" value={form.cross_clamp_time} onChange={handleChange} placeholder="e.g. 65" min="0"
                    className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>

                {/* Oxygenator */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Oxygenator</label>
                  <input type="text" name="oxygenator" value={form.oxygenator} onChange={handleChange} placeholder="e.g. Medtronic Affinity Fusion"
                    className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>

                {/* Pump type */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Pump Type</label>
                  <select name="pump_type" value={form.pump_type} onChange={handleChange}
                    className="w-full bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
                    <option value="">Select...</option>
                    {PUMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* Surgeon */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Surgeon</label>
                  <input type="text" name="surgeon" value={form.surgeon} onChange={handleChange} placeholder="Last name or initials"
                    className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>

                {/* Perfusionist */}
                <div>
                  <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Attending Perfusionist</label>
                  <input type="text" name="perfusionist" value={form.perfusionist} onChange={handleChange} placeholder="Last name or initials"
                    className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4">
                <label className="text-xs text-white/40 font-body tracking-widest uppercase block mb-1.5">Notes / Observations</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={4}
                  placeholder="Key learning points, questions, anything notable about this case..."
                  className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors resize-none" />
              </div>

              {/* Flag */}
              <div className="flex items-center gap-3 mb-5">
                <input type="checkbox" name="flagged" id="flagged" checked={form.flagged} onChange={handleChange}
                  className="accent-brand-red w-4 h-4" />
                <label htmlFor="flagged" className="text-sm text-white/50 font-body cursor-pointer">
                  Flag this case for review
                </label>
              </div>

              {error && <p className="text-brand-red text-xs font-body mb-4">{error}</p>}

              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-sm py-3 hover:bg-red-700 transition-all disabled:opacity-50">
                  {loading ? 'Saving...' : editId ? 'Update Case' : 'Save Case'}
                </button>
                <button type="button" onClick={cancelForm}
                  className="flex-1 border border-white/10 text-white/40 hover:text-white font-body text-xs tracking-widest uppercase py-3 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-2xl font-display font-bold text-white">{logs.length}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Total Cases</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-2xl font-display font-bold text-white">{flaggedCount}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Flagged</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-2xl font-display font-bold text-white">{uniqueHospitals.length}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Hospitals</div>
        </div>
      </div>

      {/* Case minimums progress */}
      <div className="bg-navy-light border border-white/10 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-white/30 font-body tracking-widest uppercase">Case Minimums Progress</span>
          <button
            onClick={() => { setShowGoals(true); setGoalsForm(goals) }}
            className="text-xs text-brand-red hover:text-red-400 font-body tracking-widest uppercase transition-colors"
          >
            Edit Goals
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(GOAL_LABELS).map(([key, label]) => {
            const val = counts[key] || 0
            const goal = goals[key]
            const done = val >= goal
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/50 font-body">{label}</span>
                  <span className={`text-xs font-display font-bold ${done ? 'text-green-400' : 'text-white/60'}`}>
                    {val} / {goal}
                  </span>
                </div>
                <ProgressBar value={val} goal={goal} />
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PROCEDURE_TYPES.map(type => {
          const count = logs.filter(l => l.procedure_type === type).length
          if (count === 0) return null
          return (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? '' : type)}
              className={`text-xs font-body px-3 py-1.5 border transition-all ${
                filterType === type
                  ? 'border-brand-red text-brand-red bg-brand-red/10'
                  : 'border-white/10 text-white/40 hover:border-white/25'
              }`}
            >
              {type} <span className="ml-1 opacity-60">{count}</span>
            </button>
          )
        })}
        {flaggedCount > 0 && (
          <button
            onClick={() => setFilterFlagged(!filterFlagged)}
            className={`text-xs font-body px-3 py-1.5 border transition-all ${
              filterFlagged
                ? 'border-brand-red text-brand-red bg-brand-red/10'
                : 'border-white/10 text-white/40 hover:border-white/25'
            }`}
          >
            ⚑ Flagged <span className="ml-1 opacity-60">{flaggedCount}</span>
          </button>
        )}
      </div>

      {/* Search + sort bar */}
      <div className="bg-navy-light border border-white/10 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text" placeholder="Search cases..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors md:col-span-1" />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="hospital">Hospital A–Z</option>
            <option value="procedure">Procedure A–Z</option>
          </select>
        </div>
        {activeFilterCount > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/30 font-body">{filteredLogs.length} of {logs.length} cases</span>
            <button onClick={clearFilters} className="text-xs text-brand-red hover:text-red-400 font-body tracking-widest uppercase transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Cases list */}
      {logs.length === 0 ? (
        <div className="border border-white/10 border-dashed p-16 text-center">
          <div className="text-white/20 text-xs font-body tracking-widest uppercase mb-3">No cases logged yet</div>
          <button
            onClick={() => setShowForm(true)}
            className="text-brand-red text-xs font-body tracking-widest uppercase hover:text-red-400 transition-colors"
          >
            Log Your First Case →
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border border-white/10 p-12 text-center">
          <div className="text-white/20 text-xs font-body tracking-widest uppercase mb-3">No cases match your filters</div>
          <button onClick={clearFilters} className="text-brand-red text-xs font-body tracking-widest uppercase hover:text-red-400 transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map(log => (
            <CaseCard
              key={log.id}
              log={log}
              expanded={expandedLog === log.id}
              onToggle={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              onFlag={handleFlag}
              onEdit={() => handleEdit(log)}
              onDelete={() => setConfirmId(log.id)}
            />
          ))}
        </div>
      )}

      {confirmId && (
        <ConfirmDialog
          message="Delete this case? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

// ─── Case Card ────────────────────────────────────────────────────────────────

function CaseCard({ log, expanded, onToggle, onFlag, onEdit, onDelete }) {
  const date = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  })

  return (
    <div className={`bg-navy-light border transition-all ${log.flagged ? 'border-brand-red/40' : 'border-white/10'}`}>
      {/* Main row */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggle}
      >
        {/* Flag button */}
        <button
          onClick={e => onFlag(e, log)}
          className={`text-base flex-shrink-0 transition-all hover:scale-110 ${log.flagged ? 'text-brand-red' : 'text-white/15 hover:text-white/40'}`}
          title={log.flagged ? 'Remove flag' : 'Flag case'}
        >
          ⚑
        </button>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-white font-display font-semibold tracking-wider uppercase text-sm">
              {log.hospital || '—'}
            </span>
            {log.procedure_type && (
              <span className="text-xs font-body px-2 py-0.5 border border-brand-red/30 text-brand-red/80">
                {log.procedure_type}
              </span>
            )}
            {log.role && log.role !== 'Primary Perfusionist' && (
              <span className="text-xs font-body text-white/30">
                {log.role}
              </span>
            )}
          </div>
          <div className="text-white/30 text-xs font-body mt-0.5">{date}</div>
        </div>

        {/* Right side stats */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {log.bypass_time && (
            <div className="text-right hidden sm:block">
              <div className="text-white/60 font-display font-bold text-sm">{log.bypass_time}m</div>
              <div className="text-white/20 text-xs font-body">bypass</div>
            </div>
          )}
          {log.cross_clamp_time && (
            <div className="text-right hidden sm:block">
              <div className="text-white/60 font-display font-bold text-sm">{log.cross_clamp_time}m</div>
              <div className="text-white/20 text-xs font-body">x-clamp</div>
            </div>
          )}
          <span className={`text-white/20 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 mb-4">
            {[
              { label: 'Procedure', val: log.procedure_type },
              { label: 'Role', val: log.role },
              { label: 'Bypass Time', val: log.bypass_time ? `${log.bypass_time} min` : null },
              { label: 'Cross-Clamp', val: log.cross_clamp_time ? `${log.cross_clamp_time} min` : null },
              { label: 'Oxygenator', val: log.oxygenator },
              { label: 'Pump Type', val: log.pump_type },
              { label: 'Surgeon', val: log.surgeon },
              { label: 'Perfusionist', val: log.perfusionist },
            ].filter(f => f.val).map(({ label, val }) => (
              <div key={label}>
                <div className="text-xs text-white/25 font-body tracking-widest uppercase mb-0.5">{label}</div>
                <div className="text-sm text-white/70 font-body">{val}</div>
              </div>
            ))}
          </div>

          {log.notes && (
            <div className="mb-4">
              <div className="text-xs text-white/25 font-body tracking-widest uppercase mb-1.5">Notes</div>
              <div className="text-sm text-white/60 font-body leading-relaxed whitespace-pre-wrap bg-white/[0.03] px-3 py-2 border border-white/5">
                {log.notes}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onEdit}
              className="text-xs font-body tracking-widest uppercase text-white/40 hover:text-white transition-colors border border-white/10 px-3 py-1.5">
              Edit
            </button>
            <button onClick={onDelete}
              className="text-xs font-body tracking-widest uppercase text-white/20 hover:text-brand-red transition-colors border border-white/5 px-3 py-1.5">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
