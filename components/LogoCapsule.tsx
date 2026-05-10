interface LogoCapsuleProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export default function LogoCapsule({ size = "md", className = "" }: LogoCapsuleProps) {
  const sizes = {
    sm: { width: 148, height: 38,  fontSize: 11, radius: 19 },
    md: { width: 188, height: 50,  fontSize: 14, radius: 25 },
    lg: { width: 248, height: 66,  fontSize: 19, radius: 33 },
    xl: { width: 330, height: 90,  fontSize: 26, radius: 45 },
  }

  const { width, height, fontSize, radius } = sizes[size]
  const half = width / 2
  const id   = `logo-${size}`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display:    "block",
        filter:     "drop-shadow(0 3px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 6px rgba(184,150,12,0.3))",
      }}
    >
      <defs>
        <clipPath id={`${id}-left`}>
          <rect x={0} y={0} width={half} height={height} />
        </clipPath>
        <clipPath id={`${id}-right`}>
          <rect x={half} y={0} width={half} height={height} />
        </clipPath>
        <clipPath id={`${id}-all`}>
          <rect x={0} y={0} width={width} height={height} rx={radius} ry={radius} />
        </clipPath>

        {/* Purple — left */}
        <linearGradient id={`${id}-purple`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#4A2F8A" />
          <stop offset="100%" stopColor="#1A0D3E" />
        </linearGradient>

        {/* Gold — right */}
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#E0B820" />
          <stop offset="100%" stopColor="#7A6008" />
        </linearGradient>

        {/* Top gloss */}
        <linearGradient id={`${id}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="white" stopOpacity={0.22} />
          <stop offset="100%" stopColor="white" stopOpacity={0}    />
        </linearGradient>

        {/* Bottom inner shadow */}
        <linearGradient id={`${id}-inner`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="black" stopOpacity={0}    />
          <stop offset="100%" stopColor="black" stopOpacity={0.3}  />
        </linearGradient>

        {/* Gold rim */}
        <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(232,192,64,0.9)" />
          <stop offset="50%"  stopColor="rgba(184,150,12,0.4)" />
          <stop offset="100%" stopColor="rgba(184,150,12,0.8)" />
        </linearGradient>
      </defs>

      {/* Base — purple left */}
      <rect
        x={0} y={0} width={width} height={height}
        rx={radius} ry={radius}
        fill={`url(#${id}-purple)`}
      />

      {/* Base — gold right */}
      <rect
        x={0} y={0} width={width} height={height}
        rx={radius} ry={radius}
        fill={`url(#${id}-gold)`}
        clipPath={`url(#${id}-right)`}
      />

      {/* Inner bottom shadow */}
      <rect
        x={0} y={0} width={width} height={height}
        rx={radius} ry={radius}
        fill={`url(#${id}-inner)`}
        clipPath={`url(#${id}-all)`}
      />

      {/* Top gloss — upper 45% */}
      <rect
        x={1} y={1} width={width - 2} height={height * 0.45}
        rx={radius} ry={radius}
        fill={`url(#${id}-gloss)`}
        clipPath={`url(#${id}-all)`}
      />

      {/* Centre seam */}
      <rect
        x={half - 0.75} y={height * 0.12}
        width={1.5} height={height * 0.76}
        fill="rgba(255,255,255,0.2)"
        clipPath={`url(#${id}-all)`}
      />

      {/* LEGACY text */}
      <text
        x={half * 0.5}
        y={height * 0.52}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F0CC50"
        fontSize={fontSize}
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight={700}
        letterSpacing="0.14em"
        clipPath={`url(#${id}-left)`}
      >
        LEGACY
      </text>

      {/* CAPSULE text */}
      <text
        x={half + half * 0.5}
        y={height * 0.52}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1A0D3E"
        fontSize={fontSize}
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight={700}
        letterSpacing="0.14em"
        clipPath={`url(#${id}-right)`}
      >
        CAPSULE
      </text>

      {/* Outer rim */}
      <rect
        x={0.75} y={0.75}
        width={width - 1.5} height={height - 1.5}
        rx={radius - 0.5} ry={radius - 0.5}
        fill="none"
        stroke={`url(#${id}-rim)`}
        strokeWidth={1.5}
      />

      {/* Inner rim */}
      <rect
        x={2.5} y={2.5}
        width={width - 5} height={height - 5}
        rx={radius - 2} ry={radius - 2}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
        clipPath={`url(#${id}-all)`}
      />
    </svg>
  )
}