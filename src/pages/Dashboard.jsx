import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PreApplicantDashboard from '../components/PreApplicantDashboard'
import StudentDashboard from '../components/StudentDashboard'
import CCPDashboard from '../components/CCPDashboard'
import ShadowTracker from './ShadowTracker'
import CaseLogger from './CaseLogger'
import Settings from './Settings'
import ProgramDirectory from './ProgramDirectory'
import ProgramDetail from './ProgramDetail'
import HospitalDirectory from './HospitalDirectory'
import ProtocolLibrary from './ProtocolLibrary'
import ProtocolTopicDetail from './ProtocolTopicDetail'
import AdminPortal from './AdminPortal'
import Welcome from '../components/Welcome'
import Sidebar from '../components/Sidebar'

const ADMIN_ID = '1f7435a2-3ecb-4218-aeb5-569a8e869c08'

export default function Dashboard({ page, programId }) {
  const { profile, user, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [welcomed, setWelcomed] = useState(false)
  const [shadowHours, setShadowHours] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase
      .from('shadow_logs')
      .select('hours')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setShadowHours(data.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0))
      })
  }, [user])

  if (!profile) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-white/40 font-body text-sm tracking-widest uppercase">Loading...</div>
      </div>
    )
  }

  const showWelcome = !page && !profile.onboarded && !welcomed

  const initials = profile.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const renderContent = () => {
    if (page === 'shadow-tracker') return <ShadowTracker />
    if (page === 'case-logger') return <CaseLogger />
    if (page === 'settings') return <Settings />
    if (page === 'programs') return <ProgramDirectory />
    if (page === 'program-detail') return <ProgramDetail />
    if (page === 'hospitals') return <HospitalDirectory />
    if (page === 'protocols') return <ProtocolLibrary />
    if (page === 'protocol-detail') return <ProtocolTopicDetail />
    if (page === 'admin') return <AdminPortal />
    switch (profile.user_type) {
      case 'pre_applicant': return <PreApplicantDashboard />
      case 'student': return <StudentDashboard />
      case 'ccp': return <CCPDashboard />
      default: return <PreApplicantDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-navy">

      {showWelcome && <Welcome onDismiss={() => setWelcomed(true)} />}
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} shadowHours={shadowHours} />}

      <div className="fixed top-0 left-0 right-0 h-1 bg-brand-red z-30" style={{ top: 0 }} />

      <nav className="border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 bg-navy z-20">
        <div className="flex items-center gap-3">
          {/* Hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1.5 p-1 hover:opacity-70 transition-opacity"
            aria-label="Open menu"
          >
            <div className="w-5 h-0.5 bg-white" />
            <div className="w-5 h-0.5 bg-white" />
            <div className="w-5 h-0.5 bg-white" />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl font-display font-bold tracking-widest uppercase hover:opacity-80 transition-opacity"
          >
            <span className="text-white">PERF</span>
            <span className="text-brand-red">PATH</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {user?.id === ADMIN_ID && (
            <button
              onClick={() => navigate('/admin')}
              className={`text-xs font-body tracking-widest uppercase transition-colors ${page === 'admin' ? 'text-brand-red' : 'text-white/20 hover:text-white/50'}`}
            >
              Admin
            </button>
          )}
          <button
            onClick={() => navigate('/settings')}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-105 ${
              page === 'settings'
                ? 'bg-brand-red ring-2 ring-brand-red ring-offset-2 ring-offset-navy'
                : 'bg-brand-red/80 hover:bg-brand-red'
            }`}
            title="Profile & Settings"
          >
            <span className="text-white font-display font-bold text-xs tracking-wider">{initials}</span>
          </button>
        </div>
      </nav>

      <main className="px-6 py-8 max-w-5xl mx-auto">
        {renderContent()}
      </main>
    </div>
  )
}
