import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import HeartLoader from '../components/HeartLoader'

export default function PreApplicantDashboard() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [recentLogs, setRecentLogs] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [totalSessions, setTotalSessions] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const { data } = await supabase
      .from('shadow_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(3)

    if (data) {
      setRecentLogs(data)
    }

    const { data: allData } = await supabase
      .from('shadow_logs')
      .select('hours')
      .eq('user_id', user.id)

    if (allData) {
      setTotalHours(allData.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0))
      setTotalSessions(allData.length)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <HeartLoader size={72} text="Loading dashboard..." />
      </div>
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="animate-fadeInUp">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-brand-red text-xs font-body tracking-widest uppercase">Pre-Applicant</span>
        </div>
        <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white">
          {getGreeting()}, {firstName}
        </h2>
        <div className="w-8 h-0.5 bg-brand-red mt-2" />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-2xl font-display font-bold text-white">{loading ? '—' : totalHours.toFixed(1)}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Shadow Hours</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-2xl font-display font-bold text-white">{loading ? '—' : totalSessions}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Sessions</div>
        </div>
        <div className="bg-navy-light border border-white/10 p-4">
          <div className="text-2xl font-display font-bold text-white">{loading ? '—' : recentLogs.length > 0 ? new Date(recentLogs[0].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
          <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">Last Session</div>
        </div>
      </div>

      {/* Quick action */}
      <button
        onClick={() => navigate('/shadow-tracker?log=true')}
        className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase py-4 text-sm hover:bg-red-700 transition-all mb-6 flex items-center justify-center gap-3"
      >
        <span>+</span> Log Shadow Session
      </button>

      {/* Recent activity */}
      {!loading && recentLogs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/30 font-body tracking-widest uppercase">Recent Sessions</div>
            <button
              onClick={() => navigate('/shadow-tracker')}
              className="text-xs text-brand-red hover:text-red-400 font-body tracking-widest uppercase transition-colors"
            >
              View All →
            </button>
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="bg-navy-light border border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {log.flagged && <span className="text-brand-red text-xs">⚑</span>}
                  <div>
                    <div className="text-white font-display font-semibold tracking-wider uppercase text-sm">{log.hospital}</div>
                    <div className="text-white/30 text-xs font-body">{new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-white/30 font-body hidden sm:block">{log.case_type}</div>
                  <div className="text-brand-red font-display font-bold text-sm">{log.hours}h</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feature cards removed — navigation lives in sidebar */}
    </div>
  )
}
