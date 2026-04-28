import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'
import { PROGRAMS } from '../data/programs'

export default function ProgramDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [isBookmarked, setIsBookmarked] = useState(false)

  const program = PROGRAMS.find(p => p.id === id)

  useEffect(() => {
    if (!program) return
    checkBookmark()
  }, [id])

  const checkBookmark = async () => {
    const { data } = await supabase
      .from('program_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('program_id', id)
      .single()
    setIsBookmarked(!!data)
  }

  const toggleBookmark = async () => {
    if (isBookmarked) {
      await supabase.from('program_bookmarks').delete()
        .eq('user_id', user.id).eq('program_id', id)
      setIsBookmarked(false)
      addToast('Bookmark removed')
    } else {
      await supabase.from('program_bookmarks').insert({ user_id: user.id, program_id: id })
      setIsBookmarked(true)
      addToast('Program bookmarked')
    }
  }

  if (!program) return (
    <div className="text-center py-20">
      <div className="text-white/30 text-sm font-body">Program not found.</div>
      <button onClick={() => navigate('/programs')} className="text-brand-red text-xs font-body tracking-widest uppercase mt-4 hover:text-red-400 transition-colors">
        ← Back to Directory
      </button>
    </div>
  )

  return (
    <div className="animate-fadeInUp max-w-3xl">

      {/* Back */}
      <button
        onClick={() => navigate('/programs')}
        className="flex items-center gap-2 text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors mb-6"
      >
        ← Program Directory
      </button>

      {/* Header */}
      <div className="bg-navy-light border border-white/10 overflow-hidden mb-6"
        style={{ borderLeft: `4px solid ${program.color}` }}>
        <div className="h-1 w-full" style={{ backgroundColor: program.color, opacity: 0.5 }} />
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-body tracking-widest uppercase mb-1" style={{ color: program.color }}>
                {program.state} — {program.degree}
              </div>
              <h2 className="text-2xl font-display font-semibold tracking-wider uppercase text-white mb-1">
                {program.name}
              </h2>
              <div className="text-white/50 font-body text-sm">{program.location}</div>
            </div>
            <button
              onClick={toggleBookmark}
              className={`text-2xl transition-all hover:scale-110 ml-4 ${isBookmarked ? 'text-brand-red' : 'text-white/20 hover:text-white/40'}`}
            >
              ♥
            </button>
          </div>

          {program.summary && (
            <p className="text-white/50 text-sm font-body leading-relaxed mt-4 pt-4 border-t border-white/10">
              {program.summary}
            </p>
          )}
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Program Length', value: program.length ? `${program.length} months` : '—' },
          { label: 'Total Tuition', value: program.totalTuition ? `$${program.totalTuition.toLocaleString()}` : '—' },
          { label: 'Class Size', value: program.classSize || '—' },
          { label: 'Grad Rate', value: program.graduationRate ? `${program.graduationRate}%` : '—' },
        ].map(stat => (
          <div key={stat.label} className="bg-navy-light border border-white/10 p-4">
            <div className="text-xl font-display font-bold text-white">{stat.value}</div>
            <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Application info */}
      <div className="bg-navy-light border border-white/10 p-6 mb-4">
        <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-4">Application Details</div>
        <div className="space-y-3">
          {[
            { label: 'Application Deadline', value: program.deadline || 'Contact program' },
            { label: 'Minimum GPA', value: program.gpaMin ? program.gpaMin.toFixed(1) : 'Not specified' },
            { label: 'Shadowing Required', value: program.shadowingRequired ? 'Yes — required' : 'Not required' },
            { label: 'Personal Statement', value: program.personalStatement ? 'Required' : 'Not required' },
            { label: 'Program Director', value: program.director || '—' },
            { label: 'Contact Email', value: program.email || '—' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-start py-2 border-b border-white/5 last:border-0">
              <span className="text-xs text-white/40 font-body tracking-widest uppercase">{item.label}</span>
              <span className="text-white text-sm font-body text-right max-w-xs">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prerequisites */}
      {program.prerequisites && program.prerequisites.length > 0 && (
        <div className="bg-navy-light border border-white/10 p-6 mb-4">
          <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-4">Prerequisites</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {program.prerequisites.map((prereq, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-body text-white/60">
                <div className="w-3 h-px bg-brand-red flex-shrink-0" />
                {prereq}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {program.notes && (
        <div className="bg-brand-red/5 border border-brand-red/20 p-4 mb-6">
          <div className="text-xs font-body tracking-widest uppercase text-brand-red/70 mb-2">Note</div>
          <p className="text-white/60 text-sm font-body leading-relaxed">{program.notes}</p>
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex gap-3">
        {program.website && (
          <a
            href={program.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs py-4 text-center hover:bg-red-700 transition-all"
          >
            Visit Program Website →
          </a>
        )}
        {program.email && (
          <a
            href={`mailto:${program.email}`}
            className="flex-1 border border-white/20 text-white font-display font-semibold tracking-widest uppercase text-xs py-4 text-center hover:border-white/40 transition-all"
          >
            Email Program
          </a>
        )}
      </div>
    </div>
  )
}
