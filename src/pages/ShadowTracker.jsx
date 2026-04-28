import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import HeartLoader from '../components/HeartLoader'
import PageHeader from '../components/PageHeader'

const CASE_TYPES = [
  'CABG',
  'Valve Replacement',
  'CABG + Valve',
  'Aortic Surgery',
  'Pediatric Cardiac',
  'ECMO',
  'Heart Transplant',
  'Lung Transplant',
  'Other',
]

const NOTES_TEMPLATE = `Procedures observed:


Equipment and circuit overview:


Key learning points:


Questions to follow up on:
`

const emptyForm = {
  date: new Date().toISOString().split('T')[0],
  hospital: '',
  city_state: '',
  perfusionist_name: '',
  hours: '',
  case_type: '',
  case_type_other: '',
  notes: NOTES_TEMPLATE,
}

export default function ShadowTracker() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
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

  // Filters
  const [search, setSearch] = useState('')
  const [filterCaseType, setFilterCaseType] = useState('')
  const [filterHospital, setFilterHospital] = useState('')
  const [filterFlagged, setFilterFlagged] = useState(false)
  const [sortBy, setSortBy] = useState('date_desc')

  useEffect(() => {
    fetchLogs()
    const params = new URLSearchParams(location.search)
    if (params.get('log') === 'true') setShowForm(true)
  }, [])

  const fetchLogs = async () => {
    setFetching(true)
    const { data, error } = await supabase
      .from('shadow_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (!error) setLogs(data || [])
    setFetching(false)
  }

  const totalHours = logs.reduce((sum, log) => sum + parseFloat(log.hours || 0), 0)
  const flaggedCount = logs.filter(l => l.flagged).length
  const uniqueHospitals = [...new Set(logs.map(l => l.hospital))]

  const filteredLogs = useMemo(() => {
    let result = [...logs]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(l =>
        l.hospital?.toLowerCase().includes(q) ||
        l.city_state?.toLowerCase().includes(q) ||
        l.perfusionist_name?.toLowerCase().includes(q) ||
        l.case_type?.toLowerCase().includes(q) ||
        l.notes?.toLowerCase().includes(q)
      )
    }
    if (filterCaseType) result = result.filter(l => l.case_type === filterCaseType)
    if (filterHospital) result = result.filter(l => l.hospital === filterHospital)
    if (filterFlagged) result = result.filter(l => l.flagged)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return new Date(b.date) - new Date(a.date)
        case 'date_asc': return new Date(a.date) - new Date(b.date)
        case 'hospital': return a.hospital.localeCompare(b.hospital)
        case 'case_type': return a.case_type.localeCompare(b.case_type)
        case 'hours_desc': return b.hours - a.hours
        default: return 0
      }
    })
    return result
  }, [logs, search, filterCaseType, filterHospital, filterFlagged, sortBy])

  const activeFilterCount = [search, filterCaseType, filterHospital, filterFlagged].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setFilterCaseType('')
    setFilterHospital('')
    setFilterFlagged(false)
    setSortBy('date_desc')
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleEdit = (log) => {
    setEditId(log.id)
    setForm({
      date: log.date,
      hospital: log.hospital,
      city_state: log.city_state,
      perfusionist_name: log.perfusionist_name,
      hours: log.hours,
      case_type: CASE_TYPES.includes(log.case_type) ? log.case_type : 'Other',
      case_type_other: CASE_TYPES.includes(log.case_type) ? '' : log.case_type,
      notes: log.notes || NOTES_TEMPLATE,
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
      city_state: form.city_state,
      perfusionist_name: form.perfusionist_name,
      hours: parseFloat(form.hours),
      case_type: form.case_type === 'Other' ? form.case_type_other : form.case_type,
      notes: form.notes,
    }

    if (editId) {
      // Update existing
      const { error } = await supabase.from('shadow_logs').update(payload).eq('id', editId)
      if (error) {
        setError('Something went wrong. Please try again.')
      } else {
        setForm(emptyForm)
        setShowForm(false)
        setEditId(null)
        fetchLogs()
        addToast('Session updated')
      }
    } else {
      // Insert new
      const { error } = await supabase.from('shadow_logs').insert({ ...payload, user_id: user.id, flagged: false })
      if (error) {
        setError('Something went wrong. Please try again.')
      } else {
        setForm(emptyForm)
        setShowForm(false)
        fetchLogs()
        addToast('Session saved')
      }
    }
    setLoading(false)
  }

  const handleFlag = async (e, log) => {
    e.stopPropagation()
    const { error } = await supabase
      .from('shadow_logs')
      .update({ flagged: !log.flagged })
      .eq('id', log.id)
    if (!error) {
      setLogs(prev => prev.map(l => l.id === log.id ? { ...l, flagged: !l.flagged } : l))
      addToast(log.flagged ? 'Flag removed' : 'Session flagged')
    }
  }

  const handleDelete = async () => {
    if (!confirmId) return
    await supabase.from('shadow_logs').delete().eq('id', confirmId)
    setConfirmId(null)
    fetchLogs()
    addToast('Session deleted', 'info')
  }

  return (
    <div className="animate-fadeInUp">

      {/* Confirm dialog */}
      {confirmId && (
        <ConfirmDialog
          message="Delete this session? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Page header with breadcrumb and quick nav */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Shadow Tracker" currentId="shadow-tracker" />
        <button
          onClick={() => {
            setShowForm(!showForm)
            if (showForm) { setEditId(null); setForm(emptyForm) }
          }}
          className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-6 py-3 hover:bg-red-700 transition-all mt-8 flex-shrink-0"
        >
          {showForm ? 'Cancel' : '+ Log Session'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-3xl font-display font-bold text-white">{totalHours.toFixed(1)}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Total Hours</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-3xl font-display font-bold text-white">{logs.length}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Sessions</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-3xl font-display font-bold text-white">{uniqueHospitals.length}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Hospitals</div>
        </div>
        <div
          onClick={() => setFilterFlagged(!filterFlagged)}
          className={`p-4 cursor-pointer transition-all border ${filterFlagged ? 'bg-brand-red/10 border-brand-red/50' : 'bg-navy-light border-white/10 hover:border-white/20'}`}
        >
          <div className={`text-3xl font-display font-bold ${filterFlagged ? 'text-brand-red' : 'text-white'}`}>{flaggedCount}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">⚑ Flagged</div>
        </div>
      </div>

      {/* Log Form */}
      {showForm && (
        <div className="bg-navy-light border border-brand-red/30 p-6 mb-8 animate-fadeInUp">
          <h3 className="text-lg font-display font-semibold tracking-wider uppercase text-white mb-6">
            {editId ? 'Edit Session' : 'New Shadow Session'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Date</label>
                <input type="date" name="date" value={form.date} onChange={handleChange} required
                  className="w-full bg-navy border border-white/10 text-white px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Hours</label>
                <input type="number" name="hours" value={form.hours} onChange={handleChange} placeholder="e.g. 4.5" step="0.5" min="0.5" required
                  className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Hospital / Facility</label>
              <input type="text" name="hospital" value={form.hospital} onChange={handleChange} placeholder="e.g. Upstate University Hospital" required
                className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">City, State</label>
              <input type="text" name="city_state" value={form.city_state} onChange={handleChange} placeholder="e.g. Syracuse, NY" required
                className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Supervising Perfusionist</label>
              <input type="text" name="perfusionist_name" value={form.perfusionist_name} onChange={handleChange} placeholder="Full name" required
                className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Case Type Observed</label>
              <select name="case_type" value={form.case_type} onChange={handleChange} required
                className="w-full bg-navy border border-white/10 text-white px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
                <option value="">Select case type</option>
                {CASE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            {form.case_type === 'Other' && (
              <div>
                <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Specify Case Type</label>
                <input type="text" name="case_type_other" value={form.case_type_other} onChange={handleChange} placeholder="Describe the case type" required
                  className="w-full bg-navy border border-white/10 text-white placeholder-white/20 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors" />
              </div>
            )}
            <div>
              <label className="block text-xs font-body font-medium tracking-widest uppercase text-white/50 mb-2">Session Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={10}
                className="w-full bg-navy border border-white/10 text-white px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors resize-none leading-relaxed" />
            </div>
            {error && <div className="border border-brand-red/50 bg-brand-red/10 px-4 py-3 text-brand-red text-sm font-body">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all disabled:opacity-50">
              {loading ? 'Saving...' : editId ? 'Update Session' : 'Save Session'}
            </button>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      {logs.length > 0 && (
        <div className="bg-navy-light border border-white/10 p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input
              type="text"
              placeholder="Search sessions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors md:col-span-2"
            />
            <select value={filterCaseType} onChange={e => setFilterCaseType(e.target.value)}
              className="bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
              <option value="">All Case Types</option>
              {[...new Set(logs.map(l => l.case_type))].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select value={filterHospital} onChange={e => setFilterHospital(e.target.value)}
              className="bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
              <option value="">All Hospitals</option>
              {uniqueHospitals.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30 font-body tracking-widest uppercase">Sort</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="bg-navy border border-white/10 text-white px-3 py-1.5 font-body text-xs focus:outline-none focus:border-brand-red transition-colors">
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="hospital">Hospital A–Z</option>
                <option value="case_type">Case Type A–Z</option>
                <option value="hours_desc">Most Hours</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFilterFlagged(!filterFlagged)}
                className={`flex items-center gap-2 text-xs font-body tracking-widest uppercase px-3 py-1.5 border transition-all ${filterFlagged ? 'border-brand-red text-brand-red bg-brand-red/10' : 'border-white/10 text-white/40 hover:border-white/30'}`}
              >
                ⚑ Flagged Only
              </button>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  className="text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors">
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {logs.length > 0 && (
        <div className="text-xs text-white/25 font-body tracking-widest uppercase mb-3">
          {filteredLogs.length} of {logs.length} sessions
        </div>
      )}

      {/* Log List */}
      {fetching ? (
        <div className="flex items-center justify-center py-20">
          <HeartLoader size={72} text="Loading sessions..." />
        </div>
      ) : logs.length === 0 ? (
        <div className="border border-white/10 p-12 text-center">
          <div className="text-4xl mb-4 opacity-20">◈</div>
          <div className="text-white font-display font-semibold tracking-wider uppercase text-lg mb-2">No Sessions Yet</div>
          <div className="text-white/40 text-sm font-body mb-6 max-w-xs mx-auto leading-relaxed">
            After your first shadow day, log it here. Every hour counts toward your application.
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-8 py-3 hover:bg-red-700 transition-all"
          >
            + Log Your First Session
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="border border-white/10 p-12 text-center">
          <div className="text-white/20 text-xs font-body tracking-widest uppercase mb-3">No sessions match your filters</div>
          <button onClick={clearFilters} className="text-brand-red text-xs font-body tracking-widest uppercase hover:text-red-400 transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <div key={log.id}
              className={`bg-navy-light transition-all ${log.flagged
                ? 'border-l-2 border-l-brand-red border border-t-white/10 border-r-white/10 border-b-white/10'
                : 'border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Compact row */}
              <div
                className="px-4 py-3 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    onClick={(e) => handleFlag(e, log)}
                    className={`flex-shrink-0 text-base transition-all hover:scale-110 ${log.flagged ? 'text-brand-red' : 'text-white/15 hover:text-white/40'}`}
                    title={log.flagged ? 'Unflag' : 'Flag for review'}
                  >
                    ⚑
                  </button>
                  <div className="flex-shrink-0 text-xs text-white/30 font-body tracking-widest uppercase w-24">
                    {new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-display font-semibold tracking-wider uppercase text-sm truncate">{log.hospital}</div>
                    <div className="text-white/30 text-xs font-body truncate">{log.city_state}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-xs text-white/30 font-body hidden sm:block">{log.case_type}</div>
                  <div className="text-brand-red font-display font-bold">{log.hours}h</div>
                  <div className="text-white/20 text-xs">{expandedLog === log.id ? '▲' : '▼'}</div>
                </div>
              </div>

              {/* Expanded */}
              {expandedLog === log.id && (
                <div className="px-4 pb-4 border-t border-white/10 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-white/30 font-body tracking-widest uppercase mb-1">Case Type</div>
                      <div className="text-white text-sm font-body">{log.case_type}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/30 font-body tracking-widest uppercase mb-1">Supervising Perfusionist</div>
                      <div className="text-white text-sm font-body">{log.perfusionist_name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/30 font-body tracking-widest uppercase mb-1">Location</div>
                      <div className="text-white text-sm font-body">{log.city_state}</div>
                    </div>
                  </div>
                  {log.notes && (
                    <div>
                      <div className="text-xs text-white/30 font-body tracking-widest uppercase mb-2">Session Notes</div>
                      <div className="text-white/60 text-sm font-body leading-relaxed whitespace-pre-wrap bg-navy p-4 border border-white/5">
                        {log.notes}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <button onClick={(e) => handleFlag(e, log)}
                      className={`text-xs font-body tracking-widest uppercase transition-colors ${log.flagged ? 'text-brand-red hover:text-red-400' : 'text-white/20 hover:text-white/40'}`}>
                      {log.flagged ? '⚑ Unflag' : '⚑ Flag for Review'}
                    </button>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleEdit(log)}
                        className="text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors"
                      >
                        Edit
                      </button>
                      <button onClick={() => setConfirmId(log.id)}
                        className="text-xs text-white/20 hover:text-brand-red font-body tracking-widest uppercase transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
