'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Phone,
  Globe,
  Loader,
  Copy,
  RefreshCw,
  Navigation,
  CloudSun,
  AlertCircle,
  Crosshair,
} from 'lucide-react'

// Leaflet relies on the browser, so load the map only on the client.
const ServiceMap = dynamic(
  () => import('@/components/service-map').then((m) => m.ServiceMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 rounded-lg border border-border bg-secondary flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    ),
  }
)

interface Service {
  name: string
  distance?: string
  distanceKm?: number
  address?: string
  phone?: string
  website?: string
  lat?: number
  lng?: number
  serviceType?: string
}

interface Weather {
  temperature: number
  condition: string
  humidity: number
}

interface NearbyResponse {
  location: { lat: number; lng: number }
  locationSource: 'device' | 'ip' | 'default'
  place: string | null
  serviceType: string
  services: Service[]
  dataSource: 'overpass' | 'database'
  weather: Weather | null
  timestamp: string
}

const SERVICE_TYPES: { id: string; label: string }[] = [
  { id: 'hospital', label: 'Hospitals' },
  { id: 'pharmacy', label: 'Pharmacies' },
  { id: 'police', label: 'Police' },
  { id: 'restaurant', label: 'Restaurants' },
  { id: 'cafe', label: 'Cafes' },
  { id: 'gas_station', label: 'Gas Stations' },
  { id: 'bank', label: 'Banks' },
  { id: 'hotel', label: 'Hotels' },
]

const RADIUS_OPTIONS = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
]

export default function ServicesPage() {
  const [selectedType, setSelectedType] = useState('hospital')
  const [radius, setRadius] = useState(5000)
  const [searchQuery, setSearchQuery] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [place, setPlace] = useState<string | null>(null)
  const [locationSource, setLocationSource] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  // Fetch services from the live API for a given location + type + radius.
  const fetchServices = useCallback(
    async (coords: { lat: number; lng: number } | null, type: string, rad: number) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/nearby-services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coords?.lat,
            lng: coords?.lng,
            serviceType: type,
            radius: rad,
          }),
        })
        if (!res.ok) throw new Error('Request failed')
        const data: NearbyResponse = await res.json()

        setServices(data.services || [])
        if (
          data.location &&
          typeof data.location.lat === 'number' &&
          typeof data.location.lng === 'number'
        ) {
          setUserLocation(data.location)
        }
        setPlace(data.place)
        setLocationSource(data.locationSource)
        setDataSource(data.dataSource)
        setWeather(data.weather)
        setLastUpdated(data.timestamp)
      } catch (err) {
        console.error('[v0] Failed to fetch nearby services:', err)
        setError('Could not load nearby services. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // Ask the browser for the device's real-time location, then fetch.
  const locateAndFetch = useCallback(
    (type: string, rad: number) => {
      setLoading(true)
      setError(null)
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
            fetchServices(coords, type, rad)
          },
          (geoErr) => {
            console.log('[v0] Geolocation denied/failed, falling back to IP:', geoErr.message)
            // No device location -> let the server resolve via IP.
            fetchServices(null, type, rad)
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
      } else {
        fetchServices(null, type, rad)
      }
    },
    [fetchServices]
  )

  // Initial load: request location and fetch services.
  useEffect(() => {
    locateAndFetch(selectedType, radius)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When type or radius changes, re-fetch using the location we already have.
  const handleTypeChange = (type: string) => {
    setSelectedType(type)
    if (userLocation) {
      fetchServices(userLocation, type, radius)
    } else {
      locateAndFetch(type, radius)
    }
  }

  const handleRadiusChange = (rad: number) => {
    setRadius(rad)
    if (userLocation) {
      fetchServices(userLocation, selectedType, rad)
    } else {
      locateAndFetch(selectedType, rad)
    }
  }

  const filteredServices = services.filter((service) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      service.name.toLowerCase().includes(q) ||
      (service.address?.toLowerCase().includes(q) ?? false)
    )
  })

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const callService = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const directionsUrl = (s: Service) =>
    typeof s.lat === 'number' && typeof s.lng === 'number'
      ? `https://www.openstreetmap.org/directions?to=${s.lat},${s.lng}`
      : `https://www.openstreetmap.org/search?query=${encodeURIComponent(s.name)}`

  const locationLabel = () => {
    if (place) return place
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      return `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
    }
    return 'Detecting location...'
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-secondary rounded-lg">
              <MapPin className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground">Local Service Finder</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time nearby services from OpenStreetMap
              </p>
            </div>
          </div>

          {/* Location + weather status bar */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
              <Crosshair className="w-4 h-4 text-primary" />
              <span className="text-foreground font-light">{locationLabel()}</span>
              {locationSource === 'ip' && (
                <span className="text-xs text-muted-foreground">(approx. by IP)</span>
              )}
            </div>
            {weather && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-lg">
                <CloudSun className="w-4 h-4 text-primary" />
                <span className="text-foreground font-light">
                  {Math.round(weather.temperature)}°C · {weather.condition}
                </span>
              </div>
            )}
            <button
              onClick={() => locateAndFetch(selectedType, radius)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-light hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-2">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
              {dataSource === 'database' && ' · showing curated results (live data unavailable)'}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Search results by name or address
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter the list below..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-foreground mb-2">Service Type</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleTypeChange(type.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                      selectedType === type.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-border'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-light text-foreground mb-2">
                Search Radius
              </label>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRadiusChange(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-light transition-colors ${
                      radius === opt.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground hover:bg-border'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-8">
          <ServiceMap
            services={filteredServices}
            userLocation={userLocation ?? undefined}
            center={userLocation ?? undefined}
          />
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-light text-foreground mb-4 flex items-center gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin text-muted-foreground" />}
            {loading
              ? 'Finding nearby services...'
              : `${filteredServices.length} ${
                  SERVICE_TYPES.find((t) => t.id === selectedType)?.label ?? 'Services'
                } Found`}
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg mb-4">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive font-light">{error}</span>
            </div>
          )}

          {!loading && !error && filteredServices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-light">
                No services found nearby. Try a larger radius or a different service type.
              </p>
            </div>
          )}

          {filteredServices.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service, idx) => (
                <div
                  key={`${service.name}-${idx}`}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors flex flex-col"
                >
                  <div className="mb-4">
                    <h3 className="text-base font-light text-foreground">{service.name}</h3>
                    {service.distance && (
                      <p className="text-xs text-primary font-light mt-1">{service.distance} away</p>
                    )}
                  </div>

                  {service.address && (
                    <div className="flex gap-2 mb-3 p-3 bg-background rounded-lg">
                      <MapPin className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground">{service.address}</p>
                    </div>
                  )}

                  <div className="space-y-2 mt-auto">
                    {service.phone && (
                      <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-4 h-4 text-foreground flex-shrink-0" />
                          <span className="text-xs font-light text-foreground truncate">
                            {service.phone}
                          </span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => callService(service.phone!)}
                            className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                          >
                            Call
                          </button>
                          <button
                            onClick={() => copyToClipboard(service.phone!, `phone-${idx}`)}
                            className="p-1 hover:bg-secondary rounded transition-colors"
                          >
                            <Copy
                              className={`w-3 h-3 ${copied === `phone-${idx}` ? 'text-primary' : 'text-muted-foreground'}`}
                            />
                          </button>
                        </div>
                      </div>
                    )}

                    <a
                      href={directionsUrl(service)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-background rounded-lg hover:border hover:border-primary transition-colors"
                    >
                      <Navigation className="w-4 h-4 text-foreground" />
                      <span className="text-xs font-light text-foreground">Directions</span>
                    </a>

                    {service.website && (
                      <a
                        href={service.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-background rounded-lg hover:border hover:border-primary transition-colors"
                      >
                        <Globe className="w-4 h-4 text-foreground" />
                        <span className="text-xs font-light text-foreground hover:text-primary truncate">
                          Visit Website
                        </span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
