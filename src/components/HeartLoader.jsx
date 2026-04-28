export default function HeartLoader({ size = 80, text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div style={{ width: size, height: size }} className="relative">
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            {/* Clipping mask that rises from bottom */}
            <clipPath id="fillClip">
              <rect x="0" y="100" width="100" height="100">
                <animate
                  attributeName="y"
                  from="100"
                  to="0"
                  dur="1.4s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                />
              </rect>
            </clipPath>

            {/* Pulse animation clip */}
            <clipPath id="pulseClip">
              <rect x="0" y="100" width="100" height="100">
                <animate
                  attributeName="y"
                  from="100"
                  to="0"
                  dur="1.4s"
                  repeatCount="indefinite"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                />
              </rect>
            </clipPath>
          </defs>

          {/* Anatomical heart path — stylized cardiac silhouette */}
          {/* Outline — always visible */}
          <path
            d="M50 85
               C50 85 15 62 10 42
               C6 28 12 15 22 12
               C30 10 38 14 44 20
               C46 22 48 25 50 28
               C52 25 54 22 56 20
               C62 14 70 10 78 12
               C88 15 94 28 90 42
               C85 62 50 85 50 85Z"
            fill="none"
            stroke="rgba(192,57,43,0.3)"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          {/* Aortic arch detail */}
          <path
            d="M44 20 C42 14 43 8 48 6 C52 4 55 7 56 12"
            fill="none"
            stroke="rgba(192,57,43,0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Fill — rises from bottom */}
          <path
            d="M50 85
               C50 85 15 62 10 42
               C6 28 12 15 22 12
               C30 10 38 14 44 20
               C46 22 48 25 50 28
               C52 25 54 22 56 20
               C62 14 70 10 78 12
               C88 15 94 28 90 42
               C85 62 50 85 50 85Z"
            fill="#C0392B"
            clipPath="url(#fillClip)"
            opacity="0.85"
          />

          {/* Aortic arch fill */}
          <path
            d="M44 20 C42 14 43 8 48 6 C52 4 55 7 56 12"
            fill="none"
            stroke="#C0392B"
            strokeWidth="1.5"
            strokeLinecap="round"
            clipPath="url(#pulseClip)"
            opacity="0.85"
          />

          {/* Pulse line — EKG style across the heart */}
          <g clipPath="url(#fillClip)">
            <path
              d="M20 48 L32 48 L36 38 L40 56 L44 44 L48 50 L52 50 L56 44 L60 56 L64 38 L68 48 L80 48"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="100"
                to="0"
                dur="1.4s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </svg>
      </div>

      {text && (
        <div className="text-white/30 text-xs font-body tracking-widest uppercase animate-pulse">
          {text}
        </div>
      )}
    </div>
  )
}
