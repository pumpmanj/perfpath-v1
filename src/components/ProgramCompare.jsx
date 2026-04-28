import { useNavigate } from 'react-router-dom'
import { PROGRAMS } from '../data/programs'

const ROWS = [
  { label: 'Location', key: 'location' },
  { label: 'Degree', key: 'degree' },
  { label: 'Length', key: 'length', format: v => v ? `${v} months` : '—' },
  { label: 'Class Size', key: 'classSize', format: v => v ? `~${v} students` : 'Not published' },
  { label: 'Min GPA', key: 'gpaMin', format: v => v ? v.toFixed(1) : 'Not stated' },
  { label: 'GRE Required', key: 'gre', format: v => v ? 'Yes' : 'No', highlight: (vals) => highlightBool(vals, false) },
  { label: 'Shadowing Required', key: 'shadowingRequired', format: v => v ? 'Required' : 'Not required' },
  { label: 'Application Deadline', key: 'deadline', format: v => v || 'Contact program' },
  { label: 'Tuition', key: 'totalTuition', format: v => v ? `$${v.toLocaleString()}` : 'Not published' },
  { label: 'Accreditation', key: 'accreditationStatus' },
  { label: 'Admissions Open', key: 'admissionsOpen', format: v => v ? 'Yes' : '⚠️ Closed / Paused' },
  { label: 'Personal Statement', key: 'personalStatement', format: v => v ? 'Required' : 'Not required' },
]

function highlightBool(vals, preferred) {
  return vals.map(v => v === preferred)
}

export default function ProgramCompare({ programIds, onClose }) {
  const navigate = useNavigate()
  const programs = programIds.map(id => PROGRAMS.find(p => p.id === id)).filter(Boolean)

  if (programs.length < 2) return null

  const getAccreditationColor = (status) => {
    if (status === 'Probationary') return 'text-yellow-400'
    if (status === 'Candidacy') return 'text-yellow-400'
    return 'text-white/70'
  }

  const getAdmissionsColor = (open) => open ? 'text-white/70' : 'text-brand-red'

  const getGpaColor = (vals, current) => {
    const nums = vals.filter(v => v !== null && v !== undefined)
    if (!nums.length || current === null || current === undefined) return ''
    const min = Math.min(...nums)
    return current === min ? 'text-green-400' : ''
  }

  const getLengthColor = (vals, current) => {
    if (!current) return ''
    const min = Math.min(...vals.filter(Boolean))
    return current === min ? 'text-green-400' : ''
  }

  const getTuitionColor = (vals, current) => {
    if (!current) return ''
    const nums = vals.filter(Boolean)
    if (!nums.length) return ''
    const min = Math.min(...nums)
    return current === min ? 'text-green-400' : ''
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-auto">
      <div className="min-h-screen px-4 py-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-brand-red font-body tracking-widest uppercase mb-1">Program Comparison</div>
            <h2 className="text-2xl font-display font-bold tracking-wider uppercase text-white">
              Comparing {programs.length} Programs
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white font-body text-xs tracking-widest uppercase transition-colors border border-white/10 px-4 py-2"
          >
            Close ✕
          </button>
        </div>

        {/* Compare table */}
        <div className="max-w-6xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">

              {/* Program header row */}
              <thead>
                <tr>
                  <th className="w-36 min-w-36" />
                  {programs.map(p => (
                    <th key={p.id} className="p-0 align-top">
                      <div className="bg-navy-light border border-white/10 mx-1 mb-0">
                        {/* Color bar */}
                        <div className="h-1 w-full" style={{ backgroundColor: p.color }} />
                        <div className="p-4">
                          <button
                            onClick={() => { navigate(`/programs/${p.id}`); onClose() }}
                            className="text-left hover:opacity-80 transition-opacity"
                          >
                            <div className="font-display font-bold tracking-wider uppercase text-white text-sm leading-tight mb-1">
                              {p.name}
                            </div>
                            <div className="text-xs text-white/40 font-body">{p.location}</div>
                          </button>
                          {!p.admissionsOpen && (
                            <div className="mt-2 text-xs text-brand-red font-body tracking-wider uppercase">
                              ⚠️ Admissions closed
                            </div>
                          )}
                          {p.accreditationStatus !== 'Accredited' && (
                            <div className="mt-1 text-xs text-yellow-400 font-body tracking-wider uppercase">
                              ⚠️ {p.accreditationStatus}
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {ROWS.map((row, rowIdx) => {
                  const vals = programs.map(p => p[row.key])

                  return (
                    <tr
                      key={row.key}
                      className={rowIdx % 2 === 0 ? 'bg-white/[0.02]' : ''}
                    >
                      {/* Row label */}
                      <td className="py-3 pr-4 text-xs font-body tracking-widest uppercase text-white/30 align-middle whitespace-nowrap">
                        {row.label}
                      </td>

                      {/* Values */}
                      {programs.map((p, i) => {
                        const raw = p[row.key]
                        const formatted = row.format ? row.format(raw) : (raw ?? '—')

                        // Color logic
                        let colorClass = 'text-white/70'
                        if (row.key === 'accreditationStatus') colorClass = getAccreditationColor(raw)
                        if (row.key === 'admissionsOpen') colorClass = getAdmissionsColor(raw)
                        if (row.key === 'gpaMin') colorClass = getGpaColor(vals, raw) || colorClass
                        if (row.key === 'length') colorClass = getLengthColor(vals, raw) || colorClass
                        if (row.key === 'totalTuition') colorClass = getTuitionColor(vals, raw) || colorClass
                        if (row.key === 'gre' && raw === false) colorClass = 'text-green-400'
                        if (row.key === 'gre' && raw === true) colorClass = 'text-white/40'

                        return (
                          <td key={p.id} className="py-3 px-1 align-middle">
                            <div className={`bg-navy-light border border-white/5 mx-1 px-4 py-2 text-sm font-body ${colorClass}`}>
                              {String(formatted)}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}

                {/* Prerequisites row */}
                <tr>
                  <td className="py-3 pr-4 text-xs font-body tracking-widest uppercase text-white/30 align-top whitespace-nowrap pt-4">
                    Prerequisites
                  </td>
                  {programs.map(p => (
                    <td key={p.id} className="py-3 px-1 align-top">
                      <div className="bg-navy-light border border-white/5 mx-1 px-4 py-3">
                        <ul className="space-y-1">
                          {p.prerequisites.map((prereq, i) => (
                            <li key={i} className="text-xs text-white/50 font-body flex items-start gap-2">
                              <span className="text-brand-red mt-0.5 flex-shrink-0">–</span>
                              <span>{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Notes row */}
                <tr className="bg-white/[0.02]">
                  <td className="py-3 pr-4 text-xs font-body tracking-widest uppercase text-white/30 align-top whitespace-nowrap pt-4">
                    Notes
                  </td>
                  {programs.map(p => (
                    <td key={p.id} className="py-3 px-1 align-top">
                      <div className="bg-navy-light border border-white/5 mx-1 px-4 py-3 text-xs text-white/50 font-body leading-relaxed">
                        {p.notes || '—'}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center gap-6 text-xs font-body text-white/30">
            <div className="flex items-center gap-2">
              <span className="text-green-400">Green</span>
              <span>= favorable value (lower GPA req, shorter, cheaper)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">Yellow</span>
              <span>= accreditation note — verify before applying</span>
            </div>
          </div>

          {/* View full profiles */}
          <div className="mt-6 flex flex-wrap gap-3">
            {programs.map(p => (
              <button
                key={p.id}
                onClick={() => { navigate(`/programs/${p.id}`); onClose() }}
                className="text-xs font-display font-semibold tracking-wider uppercase px-4 py-2 border text-white/60 hover:text-white hover:border-white/30 transition-all border-white/10"
                style={{ borderLeftColor: p.color, borderLeftWidth: 3 }}
              >
                View {p.shortName} Full Profile →
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
