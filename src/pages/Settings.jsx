import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useToast } from '../components/Toast'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ConfirmDialog'

const STAGES = [
  {
    id: 'pre_applicant',
    label: 'Pre-Applicant',
    headline: 'Exploring Perfusion',
    description: 'Building shadow hours and preparing program applications.',
    icon: '◈',
  },
  {
    id: 'student',
    label: 'Student',
    headline: 'In the Program',
    description: 'Enrolled in an accredited perfusion program, logging clinical cases.',
    icon: '◉',
  },
  {
    id: 'ccp',
    label: 'Certified CCP',
    headline: 'Practicing Perfusionist',
    description: 'Certified perfusionist managing career, CEUs, and recertification.',
    icon: '◆',
  },
]

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/

export default function Settings() {
  const { profile, updateUserType } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [stageLoading, setStageLoading] = useState(false)
  const [selected, setSelected] = useState(profile?.user_type || 'pre_applicant')
  const [pendingStage, setPendingStage] = useState(null)

  const [username, setUsername] = useState(profile?.username || '')
  const [usernameStatus, setUsernameStatus] = useState(null) // 'checking' | 'available' | 'taken' | 'invalid' | null
  const [usernameLoading, setUsernameLoading] = useState(false)

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(val)
    setUsernameStatus(null)
  }

  const checkUsername = async () => {
    if (!username) return
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus('invalid')
      return
    }
    if (username === profile?.username) {
      setUsernameStatus('available')
      return
    }
    setUsernameStatus('checking')
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    setUsernameStatus(data ? 'taken' : 'available')
  }

  const saveUsername = async () => {
    if (usernameStatus !== 'available') return
    setUsernameLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', profile.id)
    if (error) {
      addToast('Failed to save username', 'error')
    } else {
      addToast('Username saved')
    }
    setUsernameLoading(false)
  }

  const handleStageChange = (stageId) => {
    if (stageId === selected || stageLoading) return
    setPendingStage(stageId)
  }

  const confirmStageChange = async () => {
    if (!pendingStage) return
    setStageLoading(true)
    await updateUserType(pendingStage)
    setSelected(pendingStage)
    setPendingStage(null)
    setStageLoading(false)
    addToast('Stage updated')
    navigate('/dashboard')
  }

  const usernameHint = () => {
    switch (usernameStatus) {
      case 'checking': return { text: 'Checking...', color: 'text-white/30' }
      case 'available': return { text: '✓ Available', color: 'text-green-400' }
      case 'taken': return { text: '✗ Already taken', color: 'text-brand-red' }
      case 'invalid': return { text: '3–20 chars, letters, numbers, underscores only', color: 'text-brand-red' }
      default: return null
    }
  }

  const hint = usernameHint()

  return (
    <div className="animate-fadeInUp max-w-xl">

      {/* Stage confirm dialog */}
      {pendingStage && (
        <ConfirmDialog
          message={`Switch to ${STAGES.find(s => s.id === pendingStage)?.headline}? Your logged data is always preserved.`}
          onConfirm={confirmStageChange}
          onCancel={() => setPendingStage(null)}
          confirmLabel="Switch Stage"
        />
      )}

      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-xs text-white/30 hover:text-white font-body tracking-widest uppercase transition-colors mb-8"
      >
        ← Dashboard
      </button>

      {/* Avatar + name */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0">
          <span className="text-white font-display font-bold text-xl tracking-wider">{initials}</span>
        </div>
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-wider uppercase text-white">
            {profile?.full_name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            <span className="text-xs text-white/40 font-body tracking-widest uppercase">
              Member since {memberSince}
            </span>
          </div>
          {profile?.username && (
            <div className="text-xs text-white/30 font-body mt-0.5">@{profile.username}</div>
          )}
        </div>
      </div>

      {/* Account info */}
      <div className="bg-navy-light border border-white/10 p-5 mb-4">
        <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-4">Account</div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40 font-body tracking-widest uppercase">Email</span>
            <span className="text-white/60 font-body text-sm">{profile?.email}</span>
          </div>
          <div className="w-full h-px bg-white/5" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-white/40 font-body tracking-widest uppercase">Member Since</span>
            <span className="text-brand-red font-display font-semibold tracking-wider uppercase text-sm">{memberSince}</span>
          </div>
        </div>
      </div>

      {/* Username */}
      <div className="bg-navy-light border border-white/10 p-5 mb-4">
        <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-1">Username</div>
        <p className="text-white/25 text-xs font-body mb-4">
          Set a unique username to log in without your email.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-body text-sm">@</span>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onBlur={checkUsername}
              placeholder="yourname"
              maxLength={20}
              className="w-full bg-navy border border-white/10 text-white placeholder-white/20 pl-7 pr-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <button
            onClick={saveUsername}
            disabled={usernameStatus !== 'available' || usernameLoading}
            className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-5 hover:bg-red-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {usernameLoading ? '...' : 'Save'}
          </button>
        </div>
        {hint && (
          <p className={`text-xs font-body mt-2 ${hint.color}`}>{hint.text}</p>
        )}
        <p className="text-white/15 text-xs font-body mt-2">
          Letters, numbers, underscores only. 3–20 characters.
        </p>
      </div>

      {/* Stage selector */}
      <div className="bg-navy-light border border-white/10 p-5">
        <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-1">My Current Stage</div>
        <p className="text-white/25 text-xs font-body mb-4">Tap a stage to switch. Your data is always preserved.</p>
        <div className="space-y-2">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={() => handleStageChange(stage.id)}
              disabled={stageLoading}
              className={`w-full text-left p-4 border transition-all duration-200 ${
                selected === stage.id
                  ? 'border-brand-red bg-brand-red/10'
                  : 'border-white/10 hover:border-white/25 bg-navy active:bg-white/5'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-base flex-shrink-0 ${selected === stage.id ? 'text-brand-red' : 'text-white/20'}`}>
                    {stage.icon}
                  </span>
                  <div>
                    <div className={`text-xs font-body tracking-widest uppercase mb-0.5 ${selected === stage.id ? 'text-brand-red' : 'text-white/30'}`}>
                      {stage.label}
                    </div>
                    <div className="text-white font-display font-semibold tracking-wider uppercase text-sm">
                      {stage.headline}
                    </div>
                    <div className="text-white/40 text-xs font-body mt-0.5 leading-relaxed">
                      {stage.description}
                    </div>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-4 transition-all ${selected === stage.id ? 'bg-brand-red' : 'bg-white/10'}`} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
