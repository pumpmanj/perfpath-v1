import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'

const FEATURES = [
  {
    icon: '⚕',
    title: 'Equipment & Pumps',
    description: 'Know exactly which heart-lung machines and oxygenators each hospital uses before you arrive.',
  },
  {
    icon: '📋',
    title: 'Case Mix & Volume',
    description: 'Annual case volume, case complexity, ECMO utilization, and pediatric case breakdown.',
  },
  {
    icon: '🕐',
    title: 'Call Structure',
    description: 'How call is structured, frequency, overnight requirements, and weekend expectations.',
  },
  {
    icon: '👥',
    title: 'Staff & Culture',
    description: 'Team size, staff tenure, leadership style, and what the OR culture is really like.',
  },
  {
    icon: '🏙',
    title: 'City & Lifestyle',
    description: 'Cost of living, housing, commute, and what life is actually like in that city.',
  },
  {
    icon: '💼',
    title: 'Hiring Status',
    description: 'Whether the hospital is actively hiring, typical compensation, and contact information.',
  },
]

export default function HospitalDirectory() {
  const navigate = useNavigate()

  return (
    <div className="animate-fadeInUp max-w-3xl">

      {/* Header */}
      <div className="mb-8">
        <PageHeader title="Hospital Directory" currentId="hospitals" />
      </div>

      {/* Vision statement */}
      <div className="bg-navy-light border border-white/10 p-6 mb-8"
        style={{ borderLeft: '3px solid #C0392B' }}>
        <p className="text-white/70 font-body text-base leading-relaxed">
          The Hospital Directory will be the first comprehensive database of hospitals that employ perfusionists — built by perfusionists, for perfusionists. Every hospital profile is crowdsourced from people who have actually worked there.
        </p>
        <p className="text-white/40 font-body text-sm leading-relaxed mt-3">
          No more relying on word of mouth to find out what call is like at a hospital, what pump they run, or whether they're actually hiring. That information will live here.
        </p>
      </div>

      {/* Feature grid */}
      <div className="mb-8">
        <div className="text-xs font-body tracking-widest uppercase text-white/30 mb-4">What Each Hospital Profile Will Include</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map((feature, i) => (
            <div key={i} className="bg-navy-light border border-white/10 p-4 flex items-start gap-4">
              <div className="text-xl flex-shrink-0 opacity-50">{feature.icon}</div>
              <div>
                <div className="text-white font-display font-semibold tracking-wider uppercase text-sm mb-1">
                  {feature.title}
                </div>
                <div className="text-white/40 text-xs font-body leading-relaxed">
                  {feature.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy-light border border-white/10 p-6 text-center">
        <div className="text-white/20 text-xs font-body tracking-widest uppercase mb-3">
          Building Soon
        </div>
        <p className="text-white/40 text-sm font-body leading-relaxed mb-4">
          The Hospital Directory is currently being built. If you're a CCP who wants to contribute early data about your hospital, reach out — your input shapes what gets built first.
        </p>
        <button
          onClick={() => navigate('/programs')}
          className="bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-xs px-8 py-3 hover:bg-red-700 transition-all"
        >
          Explore Program Directory →
        </button>
      </div>
    </div>
  )
}
