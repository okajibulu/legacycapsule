'use client'

/* =========================================================
   FILE: components/TributeMap.tsx
   TributeMap -- v5
   Theme-aware pins. Jitter for nearby coordinates.
   Accepts locked prop for band vs modal mode.
   Dynamic import only -- never SSR (D43).
   UPDATED: AI13 - Claude Sonnet 4.6 - 22 July 2026
     -- iOS Safari white map fix: CSS overrides for leaflet
        internal elements that iOS applies light mode to
     -- useEffect injects style tag to force dark background
        on .leaflet-container and tile pane
========================================================= */

import { useEffect }                                          from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip }    from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

// ============================================================
// SECTION 1 -- Types
// ============================================================

interface Pin {
  lat:     number
  lng:     number
  name:    string
  country: string
}

interface TributeMapProps {
  pins:     Pin[]
  locked?:  boolean
  pinFill?: string
  pinGlow?: string
  mapBg?:   string
}

// ============================================================
// SECTION 2 -- Jitter helper
// Offsets nearby pins so they don't stack exactly
// ============================================================

function jitterPins(pins: Pin[]): Pin[] {
  const seen = new Map<string, number>()
  return pins.map(pin => {
    const key   = `${pin.lat.toFixed(2)},${pin.lng.toFixed(2)}`
    const count = seen.get(key) ?? 0
    seen.set(key, count + 1)
    if (count === 0) return pin
    const angle  = (count * 137.5) * (Math.PI / 180) // golden angle
    const radius = 0.3 + count * 0.15
    return {
      ...pin,
      lat: pin.lat + Math.cos(angle) * radius,
      lng: pin.lng + Math.sin(angle) * radius,
    }
  })
}

// ============================================================
// SECTION 3 -- iOS dark mode CSS injector
// Leaflet's own CSS sets white backgrounds on several internal
// elements. iOS Safari respects these even when the tile layer
// is dark. We inject a style tag to force dark on all of them.
// ============================================================

function useLeafletDarkFix(mapBg: string) {
  useEffect(() => {
    const id  = 'lc-leaflet-dark-fix'
    if (document.getElementById(id)) return

    const style       = document.createElement('style')
    style.id          = id
    style.textContent = `
      .leaflet-container {
        background: ${mapBg} !important;
      }
      .leaflet-tile-pane {
        background: ${mapBg} !important;
      }
      .leaflet-tile {
        filter: none !important;
      }
      /* iOS Safari specific -- prevents automatic light mode override */
      .leaflet-container,
      .leaflet-tile-pane,
      .leaflet-map-pane {
        color-scheme: dark !important;
        -webkit-color-scheme: dark !important;
      }
      /* Tooltip styling -- keep dark regardless of OS theme */
      .leaflet-tooltip {
        background: rgba(15,10,30,0.92) !important;
        border: 1px solid rgba(226,195,107,0.25) !important;
        color: rgba(255,255,255,0.85) !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        border-radius: 6px !important;
        padding: 4px 8px !important;
      }
      .leaflet-tooltip::before {
        border-top-color: rgba(226,195,107,0.25) !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      // Do not remove on unmount -- other map instances may still need it
    }
  }, [mapBg])
}

// ============================================================
// SECTION 4 -- Component
// ============================================================

export default function TributeMap({
  pins,
  locked   = true,
  pinFill  = '#FFE27A',
  pinGlow  = 'rgba(255,226,122,0.3)',
  mapBg    = '#0a0218',
}: TributeMapProps) {
  useLeafletDarkFix(mapBg)

  const centre: [number, number]                         = [20, 10]
  const bounds: [[number, number], [number, number]]     = [[-75, -175], [80, 185]]
  const jitteredPins                                     = jitterPins(pins)

  return (
    <MapContainer
      center={centre}
      zoom={locked ? 1 : 2}
      minZoom={1}
      maxZoom={locked ? 1 : 6}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ width: '100%', height: '100%', background: mapBg, colorScheme: 'dark' }}
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
            fillColor:    pinFill,
            fillOpacity:  0.8,
            color:        pinFill,
            weight:       0,
          }}
        >
          <Tooltip>
            <span style={{ fontSize: '11px' }}>
              {pin.name} &middot; {pin.country}
            </span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
