'use client'

/* =========================================================
   TributeMap — v4
   Theme-aware pins. Jitter for nearby coordinates.
   Accepts locked prop for band vs modal mode.
   Dynamic import only — never SSR (D43).
========================================================= */

import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface Pin {
  lat: number
  lng: number
  name: string
  country: string
}

interface TributeMapProps {
  pins: Pin[]
  locked?: boolean
  pinFill?: string
  pinGlow?: string
  mapBg?: string
}

// Jitter nearby pins so they don't stack exactly
function jitterPins(pins: Pin[]): Pin[] {
  const seen = new Map<string, number>()
  return pins.map(pin => {
    const key = `${pin.lat.toFixed(2)},${pin.lng.toFixed(2)}`
    const count = seen.get(key) ?? 0
    seen.set(key, count + 1)
    if (count === 0) return pin
    // Offset in a spiral pattern
    const angle = (count * 137.5) * (Math.PI / 180) // golden angle
    const radius = 0.3 + count * 0.15
    return {
      ...pin,
      lat: pin.lat + Math.cos(angle) * radius,
      lng: pin.lng + Math.sin(angle) * radius,
    }
  })
}

export default function TributeMap({
  pins,
  locked = true,
  pinFill = '#FFE27A',
  pinGlow = 'rgba(255,226,122,0.3)',
  mapBg = '#0a0218',
}: TributeMapProps) {
  const centre: [number, number] = [20, 10]
  const bounds: [[number, number], [number, number]] = [[-75, -175], [80, 185]]
  const jitteredPins = jitterPins(pins)

  return (
    <MapContainer
      center={centre}
      zoom={locked ? 1 : 2}
      minZoom={1}
      maxZoom={locked ? 1 : 6}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ width: '100%', height: '100%', background: mapBg }}
      zoomControl={!locked}
      scrollWheelZoom={!locked}
      dragging={!locked}
      doubleClickZoom={!locked}
      attributionControl={false}
      worldCopyJump={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {jitteredPins.map((pin, i) => (
        <CircleMarker
          key={i}
          center={[pin.lat, pin.lng]}
          radius={locked ? 0.8 : 1.6}
          pathOptions={{
            fillColor: pinFill,
            fillOpacity: 0.8,
            color: pinFill,
            weight: 0,
          }}
        >
          <Tooltip>
            <span style={{ fontSize: '11px' }}>
              {pin.name} · {pin.country}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
