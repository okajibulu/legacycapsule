'use client'

/* =========================================================
   TributeMap — v3
   Accepts `locked` prop:
   - locked=true  → band view, no drag/scroll, decorative
   - locked=false → modal view, draggable, full interaction
   Gold pins from IP-geocoded lat/lng on approved contributions.
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
}

export default function TributeMap({ pins, locked = true }: TributeMapProps) {
  const centre: [number, number] = [20, 10]
  const bounds: [[number, number], [number, number]] = [[-75, -175], [80, 185]]

  return (
    <MapContainer
      center={centre}
      zoom={locked ? 1 : 2}
      minZoom={1}
      maxZoom={locked ? 1 : 6}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ width: '100%', height: '100%', background: '#0a0218' }}
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
      {pins.map((pin, i) => (
        <CircleMarker
        className="drop-shadow-[0_0_6px_rgba(243,211,107,0.45)]"
          key={i}
          center={[pin.lat, pin.lng]}
          radius={locked ? 2.5 : 4}
          pathOptions={{
  fillColor: '#F3D36B',
  fillOpacity: 0.68,
  color: '#F6E7A1',
  weight: 0.8,
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
