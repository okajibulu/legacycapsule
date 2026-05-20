'use client'

/* =========================================================
   TributeMap — v2
   Full world view, Americas visible, decorative/locked.
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
}

export default function TributeMap({ pins }: TributeMapProps) {
  // Fixed centre — slightly north of equator, centred on 10°W
  // This keeps Americas, Europe, Africa and Asia all visible at zoom 1
  const centre: [number, number] = [20, 10]

  // Hard bounds — full world, no repeat
  const bounds: [[number, number], [number, number]] = [[-75, -175], [80, 185]]

  return (
    <MapContainer
      center={centre}
      zoom={1}
      minZoom={1}
      maxZoom={1}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{
        width: '100%',
        height: '100%',
        background: '#130630',
      }}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      attributionControl={false}
      worldCopyJump={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {pins.map((pin, i) => (
        <CircleMarker
          key={i}
          center={[pin.lat, pin.lng]}
          radius={5}
          pathOptions={{
            fillColor: '#E2C36B',
            fillOpacity: 0.9,
            color: '#F0D878',
            weight: 1.5,
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
