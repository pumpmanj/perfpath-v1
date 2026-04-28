import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center relative overflow-hidden">

      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.3) 40px,
            rgba(255,255,255,0.3) 41px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 40px,
            rgba(255,255,255,0.3) 40px,
            rgba(255,255,255,0.3) 41px
          )`
        }}
      />

      {/* Red accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red" />

      <div className="relative z-10 text-center px-6">

        {/* Logo */}
        <div className="animate-fadeInUp mb-2">
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-widest uppercase">
            <span className="text-white">PERF</span>
            <span className="text-brand-red">PATH</span>
          </h1>
        </div>

        {/* Divider */}
        <div className="animate-fadeInUp animate-delay-1 flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-px bg-brand-red" />
          <div className="w-2 h-2 rounded-full bg-brand-red" />
          <div className="w-12 h-px bg-brand-red" />
        </div>

        {/* Tagline */}
        <p className="animate-fadeInUp animate-delay-2 text-white/60 text-sm md:text-base font-body tracking-[0.2em] uppercase mb-12">
          Your perfusion career. One path.
        </p>

        {/* Buttons */}
        <div className="animate-fadeInUp animate-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/signup')}
            className="px-10 py-4 bg-brand-red text-white font-display font-semibold tracking-widest uppercase text-sm hover:bg-red-700 transition-all duration-200 hover:scale-105"
          >
            Sign Up
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 border border-white/30 text-white font-display font-semibold tracking-widest uppercase text-sm hover:border-white hover:bg-white/5 transition-all duration-200"
          >
            Log In
          </button>
        </div>

        {/* Bottom tagline */}
        <p className="animate-fadeInUp animate-delay-4 mt-16 text-white/25 text-xs font-body tracking-widest uppercase">
          Built from inside the pipeline.
        </p>
      </div>

      {/* Red accent line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
    </div>
  )
}
