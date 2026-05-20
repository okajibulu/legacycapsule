'use client'

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
  const centre: [number, number] = pins.length > 0
    ? [
        pins.reduce((s, p) => s + p.lat, 0) / pins.length,
        pins.reduce((s, p) => s + p.lng, 0) / pins.length,
      ]
    : [20, 0]

  const bounds: [[number, number], [number, number]] = [[-90, -180], [90, 180]]

  return (
    <MapContainer
      center={centre}
      zoom={2}
      minZoom={2}
      maxZoom={2}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      style={{ width: '100%', height: '100%', background: '#0D0820' }}
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
          radius={6}
          pathOptions={{
            fillColor: '#B8960C',
            fillOpacity: 0.9,
            color: '#D4AE2A',
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