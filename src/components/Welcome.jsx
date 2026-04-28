import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STEPS = {
  pre_applicant: [
    {
      icon: '◈',
      title: 'Track Your Shadow Hours',
      description: 'Log every shadowing session with the hospital, supervising perfusionist, and what you observed. Build a professional record from day one.',
    },
    {
      icon: '⚑',
      title: 'Flag What Matters',
      description: 'See something you want to research later? Flag it. Your flagged sessions are always one tap away.',
    },
    {
      icon: '◆',
      title: 'Hospital Directory Coming',
      description: 'Research hospitals by equipment, case mix, and call structure before you apply. Coming soon.',
    },
  ],
  student: [
    {
      icon: '◉',
      title: 'Log Every Case',
      description: 'Track your 75 required cases with ABCP-compliant fields. Subcategory progress for pediatric and ECMO cases tracked automatically.',
    },
    {
      icon: '⚑',
      title: 'Flag Cases to Review',
      description: 'Mark complex or unusual cases you want to revisit. Build a personal reference library as you progress.',
    },
    {
      icon: '◆',
      title: 'Hospital Directory Coming',
      description: 'Research where you want to work before graduation. Equipment, case mix, city life — all in one place.',
    },
  ],
  ccp: [
    {
      icon: '◆',
      title: 'Hospital Directory Coming',
      description: 'The most comprehensive database of perfusion hospitals. Equipment, call structure, hiring status — built by perfusionists.',
    },
    {
      icon: '◈',
      title: 'Shadow Hosting',
      description: 'Open your profile to pre-applicants looking for shadow opportunities. Give back to the pipeline.',
    },
    {
      icon: '⬡',
      title: 'Community Hub Coming',
      description: 'Peer case consultation, protocol library, salary data — a professional home built specifically for perfusionists.',
    },
  ],
}

export default function Welcome({ onDismiss }) {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const userType = profile?.user_type || 'pre_applicant'
  const steps = STEPS[userType] || STEPS.pre_applicant

  const handleDismiss = async () => {
    // Mark onboarding as complete in Supabase
    await supabase
      .from('profiles')
      .update({ onboarded: true })
      .eq('id', user.id)
    onDismiss()
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/95 px-6">
      <div className="w-full max-w-md animate-fadeInUp">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold tracking-widest uppercase mb-2">
            <span className="text-white">PERF</span>
            <span className="text-brand-red">PATH</span>
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-px bg-brand-red" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-red" />
            <div className="w-8 h-px bg-brand-red" />
          </div>
        </div>

        {/* Welcome message */}
        {step === 0 && (
          <div className="text-center mb-8">
            <p className="text-white/40 text-xs font-body tracking-widest uppercase mb-2">Welcome</p>
            <h2 className="text-2xl font-display font-semibold tracking-wider uppercase text-white mb-3">
              Good to have you, {firstName}.
            </h2>
            <p className="text-white/40 text-sm font-body leading-relaxed">
              PerfPath is built for every stage of the perfusion career. Here's what you can do right now.
            </p>
          </div>
        )}

        {/* Step card */}
        <div className="bg-navy-light border border-white/10 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl text-brand-red flex-shrink-0 mt-1">
              {steps[step].icon}
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold tracking-wider uppercase text-white mb-2">
                {steps[step].title}
              </h3>
              <p className="text-white/50 text-sm font-body leading-relaxed">
                {steps[step].description}
              </p>
            </div>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`transition-all duration-300 rounded-full ${
                i === step ? 'w-6 h-1.5 bg-brand-red' : 'w-1.5 h-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step < steps.length - 1 ? (
            <>
              <button
                onClick={handleDismiss}
                className="flex-1 border border-white/10 text-white/30 font-display font-semibold tracking-widest uppercase text-xs py-4 hover:border-white/20 transition-all"
              >
                Skip
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs py-4 hover:bg-red-700 transition-all"
              >
                Next
              </button>
            </>
          ) : (
            <button
              onClick={handleDismiss}
              className="w-full bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs py-4 hover:bg-red-700 transition-all"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
