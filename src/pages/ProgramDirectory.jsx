import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { PROGRAMS, STATES, DEGREE_TYPES } from '../data/programs'
import HeartLoader from '../components/HeartLoader'
import ProgramCompare from '../components/ProgramCompare'
import PageHeader from '../components/PageHeader'

export default function ProgramDirectory() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [bookmarks, setBookmarks] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [compareList, setCompareList] = useState([])
  const [showCompare, setShowCompare] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [filterState, setFilterState] = useState('')
  const [filterDegree, setFilterDegree] = useState('')
  const [filterBookmarked, setFilterBookmarked] = useState(false)
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => { fetchBookmarks() }, [])

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('program_bookmarks')
      .select('program_id')
      .eq('user_id', user.id)
    if (data) setBookmarks(new Set(data.map(b => b.program_id)))
    setLoading(false)
  }

  const toggleBookmark = async (e, programId) => {
    e.stopPropagation()
    const isBookmarked = bookmarks.has(programId)
    if (isBookmarked) {
      await supabase.from('program_bookmarks').delete()
        .eq('user_id', user.id).eq('program_id', programId)
      setBookmarks(prev => { const n = new Set(prev); n.delete(programId); return n })
      addToast('Bookmark removed')
    } else {
      await supabase.from('program_bookmarks').insert({ user_id: user.id, program_id: programId })
      setBookmarks(prev => new Set([...prev, programId]))
      addToast('Program bookmarked')
    }
  }

  const toggleCompare = (e, programId) => {
    e.stopPropagation()
    setCompareList(prev => {
      if (prev.includes(programId)) return prev.filter(id => id !== programId)
      if (prev.length >= 3) { addToast('Max 3 programs to compare', 'info'); return prev }
      return [...prev, programId]
    })
  }

  const filteredPrograms = useMemo(() => {
    let result = [...PROGRAMS]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.director?.toLowerCase().includes(q)
      )
    }
    if (filterState) result = result.filter(p => p.state === filterState)
    if (filterDegree) result = result.filter(p => p.degree === filterDegree)
    if (filterBookmarked) result = result.filter(p => bookmarks.has(p.id))
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'tuition_asc': return (a.totalTuition || 999999) - (b.totalTuition || 999999)
        case 'tuition_desc': return (b.totalTuition || 0) - (a.totalTuition || 0)
        case 'length': return (a.length || 99) - (b.length || 99)
        case 'class_size': return (a.classSize || 99) - (b.classSize || 99)
        default: return 0
      }
    })
    return result
  }, [search, filterState, filterDegree, filterBookmarked, sortBy, bookmarks])

  const activeFilterCount = [search, filterState, filterDegree, filterBookmarked].filter(Boolean).length

  const clearFilters = () => {
    setSearch('')
    setFilterState('')
    setFilterDegree('')
    setFilterBookmarked(false)
    setSortBy('name')
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <HeartLoader size={72} text="Loading programs..." />
    </div>
  )

  return (
    <div className="animate-fadeInUp">

      {/* Header */}
      <div className="mb-6">
        <PageHeader title="Program Directory" currentId="programs" />
        <p className="text-white/40 text-sm font-body mt-2">
          {PROGRAMS.length} accredited perfusion programs · Updated April 2026
        </p>
      </div>

      {/* Compare bar */}
      {compareList.length > 0 && (
        <div className="bg-brand-red/10 border border-brand-red/30 p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-brand-red text-xs font-body tracking-widest uppercase">
              {compareList.length} selected
            </span>
            <div className="flex gap-2">
              {compareList.map(id => {
                const p = PROGRAMS.find(p => p.id === id)
                return (
                  <span key={id} className="text-white text-xs font-body bg-white/10 px-2 py-1">
                    {p?.shortName}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {compareList.length >= 2 && (
              <button
                onClick={() => setShowCompare(true)}
                className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-red-700 transition-all"
              >
                Compare
              </button>
            )}
            <button
              onClick={() => setCompareList([])}
              className="text-white/30 hover:text-white text-xs font-body tracking-widest uppercase transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-navy-light border border-white/10 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-navy border border-white/10 text-white placeholder-white/20 px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors md:col-span-2"
          />
          <select value={filterState} onChange={e => setFilterState(e.target.value)}
            className="bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
            <option value="">All States</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterDegree} onChange={e => setFilterDegree(e.target.value)}
            className="bg-navy border border-white/10 text-white px-3 py-2 font-body text-sm focus:outline-none focus:border-brand-red transition-colors">
            <option value="">All Degrees</option>
            {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 font-body tracking-widest uppercase">Sort</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="bg-navy border border-white/10 text-white px-3 py-1.5 font-body text-xs focus:outline-none focus:border-brand-red transition-colors">
              <option value="name">Name A–Z</option>
              <option value="tuition_asc">Tuition Low–High</option>
              <option value="tuition_desc">Tuition High–Low</option>
              <option value="length">Shortest First</option>
              <option value="class_size">Smallest Class</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFilterBookmarked(!filterBookmarked)}
              className={`flex items-center gap-2 text-xs font-body tracking-widest uppercase px-3 py-1.5 border transition-all ${filterBookmarked ? 'border-brand-red text-brand-red bg-brand-red/10' : 'border-white/10 text-white/40 hover:border-white/30'}`}
            >
              ♥ Saved Only
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

      {/* Results count */}
      <div className="text-xs text-white/25 font-body tracking-widest uppercase mb-4">
        {filteredPrograms.length} of {PROGRAMS.length} programs
      </div>

      {/* Program grid */}
      {filteredPrograms.length === 0 ? (
        <div className="border border-white/10 p-12 text-center">
          <div className="text-white/20 text-xs font-body tracking-widest uppercase mb-3">No programs match your filters</div>
          <button onClick={clearFilters} className="text-brand-red text-xs font-body tracking-widest uppercase hover:text-red-400 transition-colors">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map(program => (
            <ProgramCard
              key={program.id}
              program={program}
              isBookmarked={bookmarks.has(program.id)}
              isComparing={compareList.includes(program.id)}
              onBookmark={toggleBookmark}
              onCompare={toggleCompare}
              onClick={() => navigate(`/programs/${program.id}`)}
            />
          ))}
        </div>
      )}

      {/* Compare modal */}
      {showCompare && (
        <ProgramCompare
          programIds={compareList}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  )
}

function ProgramCard({ program, isBookmarked, isComparing, onBookmark, onCompare, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-navy-light border border-white/10 hover:border-white/25 transition-all cursor-pointer card-hover overflow-hidden"
      style={{ borderLeft: `3px solid ${program.color}` }}
    >
      {/* Color header strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: program.color, opacity: 0.6 }} />

      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <div className="text-white font-display font-semibold tracking-wider uppercase text-sm leading-tight mb-1">
              {program.shortName}
            </div>
            <div className="text-white/40 text-xs font-body">{program.location}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => onCompare(e, program.id)}
              className={`text-xs px-2 py-1 border font-body tracking-widest uppercase transition-all ${
                isComparing ? 'border-brand-red text-brand-red bg-brand-red/10' : 'border-white/10 text-white/20 hover:border-white/30'
              }`}
              title="Add to compare"
            >
              ⇄
            </button>
            <button
              onClick={(e) => onBookmark(e, program.id)}
              className={`text-lg transition-all hover:scale-110 ${isBookmarked ? 'text-brand-red' : 'text-white/20 hover:text-white/40'}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              ♥
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-navy p-2">
            <div className="text-white font-display font-bold text-sm">
              {program.degree}
            </div>
            <div className="text-white/30 text-xs font-body tracking-widest uppercase">Degree</div>
          </div>
          <div className="bg-navy p-2">
            <div className="text-white font-display font-bold text-sm">
              {program.length ? `${program.length}mo` : '—'}
            </div>
            <div className="text-white/30 text-xs font-body tracking-widest uppercase">Length</div>
          </div>
          <div className="bg-navy p-2">
            <div className="text-white font-display font-bold text-sm">
              {program.totalTuition ? `$${(program.totalTuition / 1000).toFixed(0)}k` : '—'}
            </div>
            <div className="text-white/30 text-xs font-body tracking-widest uppercase">Tuition</div>
          </div>
          <div className="bg-navy p-2">
            <div className="text-white font-display font-bold text-sm">
              {program.classSize || '—'}
            </div>
            <div className="text-white/30 text-xs font-body tracking-widest uppercase">Class Size</div>
          </div>
        </div>

        {/* Deadline + pass rate */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <div className="text-xs font-body text-white/30">
            {program.deadline ? `📅 ${program.deadline}` : 'Deadline: Contact'}
          </div>
          {program.graduationRate && (
            <div className="text-xs font-body text-green-400/70">
              {program.graduationRate}% grad rate
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompareModal({ programs, onClose }) {
  const FIELDS = [
    { label: 'Location', key: 'location' },
    { label: 'Degree', key: 'degree' },
    { label: 'Length', render: p => p.length ? `${p.length} months` : '—' },
    { label: 'Total Tuition', render: p => p.totalTuition ? `$${p.totalTuition.toLocaleString()}` : '—' },
    { label: 'Class Size', key: 'classSize' },
    { label: 'Grad Rate', render: p => p.graduationRate ? `${p.graduationRate}%` : '—' },
    { label: 'Application Deadline', render: p => p.deadline || 'Contact program' },
    { label: 'Shadowing Required', render: p => p.shadowingRequired ? 'Yes' : 'Not Required' },
    { label: 'Min GPA', render: p => p.gpaMin ? p.gpaMin.toFixed(1) : '—' },
    { label: 'Director', key: 'director' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-navy-dark border border-white/10 w-full max-w-4xl max-h-screen overflow-y-auto animate-fadeInUp">
        <div className="h-1 bg-brand-red" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-semibold tracking-wider uppercase text-white">
              Program Comparison
            </h3>
            <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">✕</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-body tracking-widest uppercase text-white/30 pb-4 pr-4 w-32">Field</th>
                  {programs.map(p => (
                    <th key={p.id} className="text-left pb-4 pr-4">
                      <div className="font-display font-semibold tracking-wider uppercase text-white text-sm" style={{ color: p.color }}>
                        {p.shortName}
                      </div>
                      <div className="text-white/30 text-xs font-body">{p.location}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((field, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="text-xs font-body tracking-widest uppercase text-white/30 py-3 pr-4">
                      {field.label}
                    </td>
                    {programs.map(p => (
                      <td key={p.id} className="text-white text-sm font-body py-3 pr-4">
                        {field.render ? field.render(p) : (p[field.key] || '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
