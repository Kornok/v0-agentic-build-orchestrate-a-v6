import {
  findNearbyServices,
  getLocationFromIP,
  getWeatherByLocation,
  reverseGeocode,
  type ServiceType,
} from '@/lib/real-api-services'
import { getRealServicesByCoordinates } from '@/lib/real-services-data'

export const dynamic = 'force-dynamic'

const VALID_TYPES: ServiceType[] = [
  'hospital',
  'police',
  'pharmacy',
  'restaurant',
  'cafe',
  'gas_station',
  'bank',
  'hotel',
]

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { lat, lng, serviceType, radius = 5000 } = body

    // Resolve coordinates: use provided values, fall back to IP, then NYC.
    let latitude = typeof lat === 'number' ? lat : undefined
    let longitude = typeof lng === 'number' ? lng : undefined
    let locationSource: 'device' | 'ip' | 'default' = 'device'

    if (latitude === undefined || longitude === undefined) {
      const ipLocation = await getLocationFromIP()
      if (ipLocation) {
        latitude = ipLocation.lat
        longitude = ipLocation.lng
        locationSource = 'ip'
      } else {
        latitude = 40.7128
        longitude = -74.006
        locationSource = 'default'
      }
    }

    const requestedType: ServiceType = VALID_TYPES.includes(serviceType)
      ? serviceType
      : 'restaurant'

    // Fetch live OpenStreetMap data, reverse-geocoded place name, and weather in parallel.
    const [overpassServices, place, weather] = await Promise.all([
      findNearbyServices(latitude, longitude, requestedType, radius).catch(() => []),
      reverseGeocode(latitude, longitude).catch(() => null),
      getWeatherByLocation(latitude, longitude).catch(() => null),
    ])

    let services = overpassServices
    let dataSource: 'overpass' | 'database' = 'overpass'

    // Fall back to the curated database only if the live query returned nothing.
    if (!services || services.length === 0) {
      services = getRealServicesByCoordinates(latitude, longitude, requestedType)
      dataSource = 'database'
    }

    return Response.json({
      id: crypto.randomUUID(),
      location: { lat: latitude, lng: longitude },
      locationSource,
      place: place?.label ?? null,
      serviceType: requestedType,
      services,
      dataSource,
      weather,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Nearby services error:', error)
    return Response.json({ error: 'Failed to find nearby services' }, { status: 500 })
  }
}
