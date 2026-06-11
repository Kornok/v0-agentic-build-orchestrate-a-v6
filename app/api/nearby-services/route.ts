import {
  findNearbyServices,
  getLocationFromIP,
  getWeatherByLocation,
  reverseGeocode,
  geocodePlace,
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
    const { lat, lng, serviceType, radius = 5000, place: placeQuery } = body

    // Resolve coordinates: search query > provided coords > IP > NYC default.
    let latitude = typeof lat === 'number' ? lat : undefined
    let longitude = typeof lng === 'number' ? lng : undefined
    let locationSource: 'device' | 'ip' | 'default' | 'search' = 'device'
    let searchedLabel: string | null = null

    // If the user typed a location to search, geocode it and use those coordinates.
    if (typeof placeQuery === 'string' && placeQuery.trim()) {
      const geocoded = await geocodePlace(placeQuery.trim())
      if (geocoded) {
        latitude = geocoded.lat
        longitude = geocoded.lng
        searchedLabel = geocoded.label
        locationSource = 'search'
      } else {
        return Response.json(
          { error: `Could not find a location matching "${placeQuery}".` },
          { status: 404 }
        )
      }
    }

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
      place: searchedLabel ?? place?.label ?? null,
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
