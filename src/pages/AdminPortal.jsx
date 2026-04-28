import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../components/Toast'

const ADMIN_ID = '1f7435a2-3ecb-4218-aeb5-569a8e869c08'

export default function AdminPortal() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const isAdmin = user?.id === ADMIN_ID

  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState({})
  const [pendingProtocols, setPendingProtocols] = useState([])
  const [pendingHospitals, setPendingHospitals] = useState([])
  const [pendingResources, setPendingResources] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return }
    fetchAll()
  }, [isAdmin])

  const fetchAll = async () => {
    setLoading(true)
    const [
      protocolsRes,
      pendingProtocolsRes,
      pendingResourcesRes,
      hospitalsRes,
      shadowRes,
      caseRes,
      profilesRes,
    ] = await Promise.all([
      supabase.from('protocol_topics').select('id', { count: 'exact' }).eq('approved', true),
      supabase.from('protocol_topics').select('*').eq('approved', false).order('created_at', { ascending: false }),
      supabase.from('protocol_resources').select('*, protocol_topics(title)').eq('approved', false).order('created_at', { ascending: false }),
      supabase.from('hospital_submissions').select('*').eq('approved', false).order('created_at', { ascending: false }),
      supabase.from('shadow_logs').select('id', { count: 'exact' }),
      supabase.from('case_logs').select('id', { count: 'exact' }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ])

    setStats({
      protocols: protocolsRes.count || 0,
      shadowLogs: shadowRes.count || 0,
      caseLogs: caseRes.count || 0,
      users: profilesRes.data?.length || 0,
    })
    setPendingProtocols(pendingProtocolsRes.data || [])
    setPendingHospitals(hospitalsRes.data || [])
    setPendingResources(pendingResourcesRes.data || [])
    setUsers(profilesRes.data || [])
    setLoading(false)
  }

  const approveProtocol = async (id) => {
    await supabase.from('protocol_topics').update({ approved: true }).eq('id', id)
    addToast('Topic approved')
    fetchAll()
  }

  const rejectProtocol = async (id) => {
    await supabase.from('protocol_topics').delete().eq('id', id)
    addToast('Topic rejected')
    fetchAll()
  }

  const approveResource = async (id) => {
    await supabase.from('protocol_resources').update({ approved: true }).eq('id', id)
    addToast('Resource approved')
    fetchAll()
  }

  const rejectResource = async (id) => {
    await supabase.from('protocol_resources').delete().eq('id', id)
    addToast('Resource rejected')
    fetchAll()
  }

  const approveHospital = async (id) => {
    await supabase.from('hospital_submissions').update({ approved: true }).eq('id', id)
    addToast('Hospital submission approved')
    fetchAll()
  }

  const rejectHospital = async (id) => {
    await supabase.from('hospital_submissions').delete().eq('id', id)
    addToast('Hospital submission rejected')
    fetchAll()
  }

  if (!isAdmin) return null

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'protocols', label: `Topics ${pendingProtocols.length > 0 ? `(${pendingProtocols.length})` : ''}` },
    { id: 'resources', label: `Resources ${pendingResources.length > 0 ? `(${pendingResources.length})` : ''}` },
    { id: 'hospitals', label: `Hospitals ${pendingHospitals.length > 0 ? `(${pendingHospitals.length})` : ''}` },
    { id: 'users', label: 'Users' },
  ]

  return (
    <div className="animate-fadeInUp">

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors"
          >
            Dashboard
          </button>
          <span className="text-white/15 text-xs">›</span>
          <span className="text-xs text-brand-red font-body tracking-widest uppercase">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white">Admin Portal</h2>
          <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
        </div>
        <div className="w-8 h-0.5 bg-brand-red mt-2" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-xs font-display font-semibold tracking-widest uppercase transition-all border-b-2 -mb-px ${
              tab === t.id
                ? 'border-brand-red text-white'
                : 'border-transparent text-white/30 hover:text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-xs font-body tracking-widest uppercase text-center py-12">Loading...</div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div className="animate-fadeInUp">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Users', value: stats.users },
                  { label: 'Shadow Sessions', value: stats.shadowLogs },
                  { label: 'Cases Logged', value: stats.caseLogs },
                  { label: 'Protocols', value: stats.protocols },
                ].map(stat => (
                  <div key={stat.label} className="bg-navy-light border border-white/10 p-4">
                    <div className="text-3xl font-display font-bold text-white">{stat.value}</div>
                    <div className="text-xs text-white/30 font-body tracking-widest uppercase mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Pending items alert */}
              {(pendingProtocols.length > 0 || pendingHospitals.length > 0 || pendingResources.length > 0) && (
                <div className="bg-brand-red/10 border border-brand-red/30 p-4">
                  <div className="text-brand-red text-xs font-body tracking-widest uppercase mb-2">Needs Review</div>
                  <div className="space-y-1">
                    {pendingProtocols.length > 0 && (
                      <button onClick={() => setTab('protocols')} className="block text-white/60 text-sm font-body hover:text-white transition-colors">
                        {pendingProtocols.length} topic {pendingProtocols.length === 1 ? 'submission' : 'submissions'} pending →
                      </button>
                    )}
                    {pendingResources.length > 0 && (
                      <button onClick={() => setTab('resources')} className="block text-white/60 text-sm font-body hover:text-white transition-colors">
                        {pendingResources.length} resource {pendingResources.length === 1 ? 'submission' : 'submissions'} pending →
                      </button>
                    )}
                    {pendingHospitals.length > 0 && (
                      <button onClick={() => setTab('hospitals')} className="block text-white/60 text-sm font-body hover:text-white transition-colors">
                        {pendingHospitals.length} hospital {pendingHospitals.length === 1 ? 'submission' : 'submissions'} pending →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Protocols */}
          {tab === 'protocols' && (
            <div className="animate-fadeInUp">
              {pendingProtocols.length === 0 ? (
                <div className="border border-white/10 p-12 text-center">
                  <div className="text-white/20 text-xs font-body tracking-widest uppercase">No pending submissions</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProtocols.map(p => (
                    <div key={p.id} className="bg-navy-light border border-brand-red/20 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-xs text-brand-red font-body tracking-widest uppercase mb-1">{p.category}</div>
                          <div className="text-white font-display font-semibold tracking-wider uppercase">{p.title}</div>
                          <div className="text-white/40 text-xs font-body mt-1">by {p.submitted_by_name} · {new Date(p.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveProtocol(p.id)}
                            className="bg-green-600/20 border border-green-600/50 text-green-400 font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-green-600/30 transition-all"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => rejectProtocol(p.id)}
                            className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-brand-red/20 transition-all"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                      {p.summary && <div className="text-white/50 text-sm font-body mb-3">{p.summary}</div>}
                      {p.content && (
                        <div className="text-white/40 text-xs font-body bg-navy p-3 border border-white/5 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                          {p.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Resources */}
          {tab === 'resources' && (
            <div className="animate-fadeInUp">
              {pendingResources.length === 0 ? (
                <div className="border border-white/10 p-12 text-center">
                  <div className="text-white/20 text-xs font-body tracking-widest uppercase">No pending resource submissions</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingResources.map(r => (
                    <div key={r.id} className="bg-navy-light border border-brand-red/20 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-xs text-white/30 font-body tracking-widest uppercase mb-1">
                            {r.resource_type} · {r.protocol_topics?.title}
                          </div>
                          <div className="text-white font-display font-semibold tracking-wider uppercase text-sm">{r.title}</div>
                          <div className="text-white/40 text-xs font-body mt-1">by {r.submitted_by_name} · {new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => approveResource(r.id)}
                            className="bg-green-600/20 border border-green-600/50 text-green-400 font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-green-600/30 transition-all">
                            ✓ Approve
                          </button>
                          <button onClick={() => rejectResource(r.id)}
                            className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-brand-red/20 transition-all">
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                      {r.description && <div className="text-white/50 text-sm font-body mb-2">{r.description}</div>}
                      <div className="flex items-center gap-3 flex-wrap">
                        {r.source_name && <span className="text-white/25 text-xs font-body">{r.source_name}</span>}
                        {r.author && <span className="text-white/25 text-xs font-body">by {r.author}</span>}
                        {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-brand-red text-xs font-body hover:text-red-400 transition-colors">{r.url}</a>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Hospital Submissions */}
          {tab === 'hospitals' && (
            <div className="animate-fadeInUp">
              {pendingHospitals.length === 0 ? (
                <div className="border border-white/10 p-12 text-center">
                  <div className="text-white/20 text-xs font-body tracking-widest uppercase">No pending submissions</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingHospitals.map(h => (
                    <div key={h.id} className="bg-navy-light border border-brand-red/20 p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-white font-display font-semibold tracking-wider uppercase">{h.hospital_name}</div>
                          <div className="text-white/40 text-xs font-body mt-0.5">{h.city_state}</div>
                          <div className="text-white/30 text-xs font-body mt-1">by {h.submitted_by_name} · {new Date(h.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveHospital(h.id)}
                            className="bg-green-600/20 border border-green-600/50 text-green-400 font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-green-600/30 transition-all"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => rejectHospital(h.id)}
                            className="bg-brand-red/10 border border-brand-red/30 text-brand-red font-display font-semibold tracking-widest uppercase text-xs px-4 py-2 hover:bg-brand-red/20 transition-all"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {[
                          { label: 'Pump', value: h.pump_type },
                          { label: 'Call', value: h.call_structure },
                          { label: 'Volume', value: h.case_volume },
                          { label: 'Hiring', value: h.hiring_status },
                        ].map(item => item.value && (
                          <div key={item.label} className="bg-navy p-2">
                            <div className="text-white/30 text-xs font-body tracking-widest uppercase mb-0.5">{item.label}</div>
                            <div className="text-white text-sm font-body">{item.value}</div>
                          </div>
                        ))}
                      </div>
                      {h.notes && (
                        <div className="text-white/40 text-xs font-body bg-navy p-3 border border-white/5">
                          {h.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="animate-fadeInUp">
              <div className="text-xs text-white/25 font-body tracking-widest uppercase mb-3">
                {users.length} total users
              </div>
              <div className="space-y-2">
                {users.map(u => (
                  <div key={u.id} className="bg-navy-light border border-white/10 px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-white font-body text-sm">{u.full_name}</div>
                      <div className="text-white/30 text-xs font-body">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-xs text-white/30 font-body tracking-widest uppercase">{u.user_type?.replace('_', ' ')}</div>
                      <div className="text-xs text-white/20 font-body">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
