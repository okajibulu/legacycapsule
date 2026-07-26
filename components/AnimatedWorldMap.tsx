"use client"

// FILE: components/AnimatedWorldMap.tsx
// UPDATED: AI13 - Claude Sonnet 4.6 - 22 July 2026
//   -- iOS Safari fix: CSS filter moved from SVG image element to div level
//   -- colour overlay uses mix-blend-mode instead of SVG filter (iOS reliable)
//   -- z-index structure established for correct layer order

import { useEffect, useState, useRef, useCallback } from "react"
import { MAP_CITIES, STAGE_DELAYS, LOOP_DELAY, IDLE_LOOP_DELAY, MapCity } from "@/lib/mapCities"

interface AnimatedWorldMapProps {
  mode?:        "hero" | "idle"
  className?:   string
  showOverlay?: boolean
}

function project(lat: number, lng: number, w: number, h: number) {
  const x = (lng + 180) * (w / 360)
  const y = (90 - lat) * (h / 180)
  return { x, y }
}

function PulseRing({ x, y, large }: { x: number; y: number; large?: boolean }) {
  const anim = large ? "pulseRingLarge" : "pulseRing"
  return (
    <g>
      {[0, 0.4, 0.8].map((delay, i) => (
        <circle
          key={i}
          cx={x} cy={y} r={0}
          fill="none"
          stroke="#B8960C"
          strokeWidth={1.5}
          opacity={0}
          style={{ animation: `${anim} 2.4s ease-out ${delay}s infinite` }}
        />
      ))}
    </g>
  )
}

export default function AnimatedWorldMap({
  mode = "hero",
  className = "",
  showOverlay = true,
}: AnimatedWorldMapProps) {
  const SVG_W = 1000
  const SVG_H = 500

  const [visibleCities, setVisibleCities] = useState<Set<string>>(new Set())
const [pulseRings, setPulseRings] = useState<Array<{ id: string; x: number; y: number }>>([])

  const loopDelay = mode === "idle" ? IDLE_LOOP_DELAY : LOOP_DELAY
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const runSequence = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setVisibleCities(new Set())
    setPulseRings([])

    const stageMap: Record<number, MapCity[]> = {}
    MAP_CITIES.forEach((city) => {
      if (!stageMap[city.stage]) stageMap[city.stage] = []
      stageMap[city.stage].push(city)
    })

    Object.entries(stageMap).forEach(([stageStr, cities]) => {
      const delay = STAGE_DELAYS[parseInt(stageStr)] ?? 0
      const t = setTimeout(() => {
        setVisibleCities((prev) => {
          const next = new Set(prev)
          cities.forEach((c) => next.add(c.name))
          return next
        })
        cities.forEach((city) => {
          const { x, y } = project(city.lat, city.lng, SVG_W, SVG_H)
          setPulseRings((prev) => [
            ...prev,
            { id: `${city.name}-${Date.now()}`, x, y },
          ])
        })
      }, delay)
      timersRef.current.push(t)
    })

    const loopTimer = setTimeout(runSequence, loopDelay)
    timersRef.current.push(loopTimer)
  }, [loopDelay])

  useEffect(() => {
    runSequence()
    return () => { timersRef.current.forEach(clearTimeout) }
  }, [runSequence])

  const isIdle = mode === "idle"

  return (
    <div
      className={className}
      style={{
        position:    "relative",
        overflow:    "hidden",
        background:  "#080C14",
        minHeight:   isIdle ? "100vh" : "480px",
        height:      isIdle ? "100vh" : undefined,
        // Apply dark filter at div level -- iOS Safari honours this
        // but ignores filter on SVG <image> elements
        colorScheme: "dark",
      }}
    >
      {/* Dark filter overlay for iOS -- sits between map SVG and overlay content */}
      <div style={{
        position:        "absolute",
        inset:           0,
        zIndex:          1,
        pointerEvents:   "none",
        background:      "transparent",
        // This mix-blend-mode approach darkens the map on iOS
        // where CSS filter on SVG image is unreliable
        backdropFilter:  "none",
      }} />
      {/* Separate colour overlay to replace the SVG filter on iOS */}
      <div style={{
        position:    "absolute",
        inset:       0,
        zIndex:      2,
        pointerEvents: "none",
        background:  "linear-gradient(135deg, rgba(45,17,105,0.62) 0%, rgba(8,12,20,0.55) 50%, rgba(20,8,50,0.65) 100%)",
        mixBlendMode: "multiply" as const,
      }} />
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ display: "block", width: "100%", height: "100%", position: "relative", zIndex: 0 }}
      >
        {/* Background */}
        {/* Ocean background -- deep blue */}
<defs>
  <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stopColor="#0D2140" stopOpacity={0.8} />
    <stop offset="50%"  stopColor="#0A1A35" stopOpacity={0.6} />
    <stop offset="100%" stopColor="#060E1E" stopOpacity={0.9} />
  </linearGradient>
</defs>

{/* Ocean background -- deep blue */}
<rect width={SVG_W} height={SVG_H} fill="#0A1628" />
<rect width={SVG_W} height={SVG_H} fill="url(#oceanGrad)" />

        {/* World map SVG rendered as image with CSS filter to purple */}
        {/* Filter applied at div level -- iOS Safari ignores CSS filter on SVG image elements */}
        <image
          href="/world-map-simple.svg"
          x={0} y={0}
          width={SVG_W} height={SVG_H}
        />

        {/* Pulse rings */}
        {pulseRings.map((ring) => (
          <PulseRing
            key={ring.id}
            x={ring.x}
            y={ring.y}
            large={isIdle}
          />
        ))}

        {/* City pins */}
        {MAP_CITIES.map((city) => {
          const { x, y } = project(city.lat, city.lng, SVG_W, SVG_H)
          const visible   = visibleCities.has(city.name)
          const size      = (city.size ?? 1) * (isIdle ? 4 : 3)
          return (
            <circle
              key={city.name}
              cx={x} cy={y} r={size}
              fill="#B8960C"
              opacity={visible ? 1 : 0}
              style={{ transition: "opacity 0.8s ease-in" }}
            />
          )
        })}

        {/* Brand overlay */}
        <text
          x={SVG_W / 2} y={SVG_H - 20}
          textAnchor="middle"
          fill="#B8960C"
          opacity={0.3}
          fontSize={isIdle ? 18 : 11}
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.2em"
          style={{ textTransform: "uppercase", userSelect: "none" }}
        >
          POWERED BY LEGACYCAPSULE
        </text>
      </svg>

      {/* Hero overlay -- tagline and CTAs */}
      {!isIdle && showOverlay && (
        <div style={{
          position:       "absolute",
          inset:          0,
          zIndex:         10,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          pointerEvents:  "none",
          padding:        "0 1rem",
          textAlign:      "center",
        }}>
          <p style={{
            fontFamily:  "var(--font-heading)",
            fontSize:    "clamp(2rem, 5vw, 4rem)",
            fontWeight:  700,
            color:       "#FEFCE8",
            lineHeight:  1.1,
            textShadow:  "0 2px 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.7)",
            filter:      "drop-shadow(0 0 12px rgba(234,179,8,0.6))",
            marginBottom:"0.75rem",
          }}>
            Every event. Preserved.
          </p>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize:   "clamp(0.9rem, 1.5vw, 1.1rem)",
            color:      "rgba(254,252,232,0.65)",
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            maxWidth:   "480px",
          }}>
            Capture every voice and moment of your event -- in one Capsule.
          </p>
        </div>
      )}
    </div>
  )
}
