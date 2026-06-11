'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const currentLocationIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 46],
  iconAnchor: [16, 46],
  popupAnchor: [0, -46],
  shadowSize: [50, 64],
})

L.Marker.prototype.setIcon(defaultIcon)

interface Service {
  name: string
  distance?: string
  phone?: string
  address?: string
  lat?: number
  lng?: number
}

interface ServiceMapProps {
  services: Service[]
  userLocation?: { lat: number; lng: number }
  center?: { lat: number; lng: number }
  zoom?: number
}

export function ServiceMap({ services, userLocation, center = { lat: 40.7128, lng: -74.006 }, zoom = 13 }: ServiceMapProps) {
  const [markerIcon] = useState(defaultIcon)

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[userLocation?.lat || center.lat, userLocation?.lng || center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Current Location Marker */}
        {userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number' && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={currentLocationIcon}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Service Markers */}
        {services.map((service, idx) => {
          // Try to get coordinates from service object
          let lat: number | undefined = service.lat
          let lng: number | undefined = service.lng

          // If not available, estimate based on distance (rough approximation)
          if (typeof lat !== 'number' || typeof lng !== 'number') {
            const userLat = typeof userLocation?.lat === 'number' ? userLocation.lat : center.lat
            const userLng = typeof userLocation?.lng === 'number' ? userLocation.lng : center.lng
            const angle = (idx * 360) / Math.max(services.length, 1)
            const distance = 0.01 // Roughly 1km in lat/lng degrees
            lat = userLat + Math.sin((angle * Math.PI) / 180) * distance
            lng = userLng + Math.cos((angle * Math.PI) / 180) * distance
          }

          // Only render if coordinates are valid numbers
          if (typeof lat !== 'number' || typeof lng !== 'number') {
            return null
          }

          return (
            <Marker key={`service-${idx}`} position={[lat, lng]} icon={markerIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{service.name}</p>
                  {service.distance && <p className="text-xs text-gray-600">{service.distance}</p>}
                  {service.phone && <p className="text-xs text-gray-600">{service.phone}</p>}
                  {service.address && <p className="text-xs text-gray-600">{service.address}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
