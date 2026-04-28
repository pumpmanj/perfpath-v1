import { useAuth } from '../lib/AuthContext'

export default function CCPDashboard() {
  const { profile } = useAuth()

  return (
    <div className="animate-fadeInUp">

      {/* Header */}
      <div className="mb-8">
        <p className="text-brand-red text-xs font-body tracking-widest uppercase mb-1">Certified CCP</p>
        <h2 className="text-3xl font-display font-semibold tracking-wider uppercase text-white">
          Welcome, {profile?.full_name?.split(' ')[0]}
        </h2>
        <div className="w-8 h-0.5 bg-brand-red mt-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Cases This Year', value: '0', target: '40', unit: 'required' },
          { label: 'CEUs Earned', value: '0', target: '45', unit: 'per cycle' },
          { label: 'Recert Status', value: '—', unit: 'active' },
        ].map((stat) => (
          <div key={stat.label} className="bg-navy-light border border-white/10 p-4">
            <div className="text-2xl font-display font-bold text-white">{stat.value}</div>
            {stat.target && (
              <div className="text-xs text-brand-red/60 font-body tracking-widest uppercase mt-0.5">
                of {stat.target} {stat.unit}
              </div>
            )}
            <div className="text-xs text-white/50 font-body mt-2">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-navy-light border border-white/10 p-6 card-hover cursor-pointer hover:border-brand-red/50 transition-all">
          <div className="text-brand-red text-xs font-body tracking-widest uppercase mb-3">Hospital Directory</div>
          <h3 className="text-xl font-display font-semibold tracking-wider uppercase text-white mb-2">Hospital Directory</h3>
          <p className="text-white/40 text-sm font-body leading-relaxed mb-4">
            Explore hospitals by equipment, case volume, call structure, and open positions.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/20 font-body tracking-widest uppercase">
            <div className="w-4 h-px bg-brand-red" />
            Coming Soon
          </div>
        </div>

        <div className="bg-navy-light border border-white/10 p-6 card-hover cursor-pointer hover:border-brand-red/50 transition-all">
          <div className="text-brand-red text-xs font-body tracking-widest uppercase mb-3">CCP Hub</div>
          <h3 className="text-xl font-display font-semibold tracking-wider uppercase text-white mb-2">CEU Tracker</h3>
          <p className="text-white/40 text-sm font-body leading-relaxed mb-4">
            Track continuing education units and recertification case counts in one place.
          </p>
          <div className="flex items-center gap-2 text-xs text-white/20 font-body tracking-widest uppercase">
            <div className="w-4 h-px bg-brand-red" />
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  )
}
