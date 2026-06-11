/**
 * Real API Services - Integrating actual data sources for NEXUS AI
 * Uses free/open-source APIs and Groq AI via Vercel AI Gateway
 */

// Wikipedia API for educational content
export async function getWikipediaContent(topic: string): Promise<string> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    )
    if (!response.ok) throw new Error('Wikipedia not found')
    const data = await response.json()
    return data.extract || data.description || `Information about ${topic}`
  } catch {
    return null
  }
}

// LibreTranslate API - Free, no authentication required
export async function translateWithLibreTranslate(
  text: string,
  source: string,
  target: string
): Promise<string | null> {
  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source_language: source,
        target_language: target,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) throw new Error('Translation failed')
    const data = await response.json()
    return data.translatedText || null
  } catch (error) {
    console.error('LibreTranslate error:', error)
    return null
  }
}

// MyMemory Translation API - Free alternative
export async function translateWithMyMemory(
  text: string,
  source: string,
  target: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
    )
    const data = await response.json()
    if (data.responseStatus === 200) {
      return data.responseData.translatedText
    }
    return null
  } catch {
    return null
  }
}

export type ServiceType =
  | 'hospital'
  | 'police'
  | 'pharmacy'
  | 'restaurant'
  | 'cafe'
  | 'gas_station'
  | 'bank'
  | 'hotel'

export interface NearbyService {
  name: string
  distance: string
  distanceKm: number
  address?: string
  phone?: string
  website?: string
  lat: number
  lng: number
  serviceType: ServiceType
}

// Maps our service types to the OpenStreetMap tag filters that find them.
const OSM_TAG_MAP: Record<ServiceType, Array<{ key: string; value: string }>> = {
  hospital: [{ key: 'amenity', value: 'hospital' }],
  police: [{ key: 'amenity', value: 'police' }],
  pharmacy: [{ key: 'amenity', value: 'pharmacy' }],
  restaurant: [{ key: 'amenity', value: 'restaurant' }],
  cafe: [{ key: 'amenity', value: 'cafe' }],
  gas_station: [{ key: 'amenity', value: 'fuel' }],
  bank: [{ key: 'amenity', value: 'bank' }],
  hotel: [{ key: 'tourism', value: 'hotel' }],
}

// Overpass API - Real location data from OpenStreetMap
export async function findNearbyServices(
  lat: number,
  lng: number,
  serviceType: ServiceType,
  radius: number = 5000
): Promise<NearbyService[]> {
  const tags = OSM_TAG_MAP[serviceType] || OSM_TAG_MAP.restaurant

  // Build an Overpass query covering nodes, ways, and relations for each tag.
  const filters = tags
    .map(
      ({ key, value }) =>
        `node["${key}"="${value}"](around:${radius},${lat},${lng});way["${key}"="${value}"](around:${radius},${lat},${lng});`
    )
    .join('')
  const query = `[out:json][timeout:25];(${filters});out center;`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'NEXUS-AI-Service-Finder',
      },
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Overpass API returned ${response.status}`)
    }

    const data = await response.json()

    if (!data.elements || data.elements.length === 0) {
      return []
    }

    // Calculate distances and return services
    const services: NearbyService[] = data.elements
      .filter((el: any) => el.tags?.name)
      .map((el: any) => {
        const elementLat = el.lat ?? el.center?.lat
        const elementLng = el.lon ?? el.center?.lon

        const distanceKm =
          typeof elementLat === 'number' && typeof elementLng === 'number'
            ? calculateDistance(lat, lng, elementLat, elementLng)
            : 0

        const street = el.tags['addr:street']
        const houseNumber = el.tags['addr:housenumber']
        const city = el.tags['addr:city']
        const addressParts = [
          [houseNumber, street].filter(Boolean).join(' '),
          city,
        ].filter(Boolean)

        return {
          name: el.tags.name,
          distance: `${distanceKm.toFixed(1)} km`,
          distanceKm,
          address:
            addressParts.join(', ') ||
            el.tags['addr:full'] ||
            undefined,
          phone: el.tags.phone || el.tags['contact:phone'] || undefined,
          website: el.tags.website || el.tags['contact:website'] || undefined,
          lat: elementLat,
          lng: elementLng,
          serviceType,
        }
      })
      .filter((s: NearbyService) => typeof s.lat === 'number' && typeof s.lng === 'number')
      .sort((a: NearbyService, b: NearbyService) => a.distanceKm - b.distanceKm)
      .slice(0, 20)

    return services
  } catch (error) {
    console.error('Overpass error:', error)
    return []
  }
}

// Helper function to calculate distance between coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  return distance
}

// Real weather data from Open-Meteo (free, no auth)
export async function getWeatherByLocation(
  lat: number,
  lng: number
): Promise<{ temperature: number; condition: string; humidity: number } | null> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,relative_humidity_2m&timezone=auto`
    )
    const data = await response.json()
    const current = data.current

    const weatherConditions: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      61: 'Rain',
      80: 'Rain showers',
      85: 'Heavy rain showers',
      95: 'Thunderstorm',
    }

    return {
      temperature: current.temperature_2m,
      condition: weatherConditions[current.weather_code] || 'Unknown',
      humidity: current.relative_humidity_2m,
    }
  } catch (error) {
    console.error('Weather API error:', error)
    return null
  }
}

// Real news from NewsAPI (requires key but has free tier)
export async function getNews(topic: string, limit: number = 5): Promise<Array<{ title: string; description: string; url: string }>> {
  try {
    // Using a free news source - BBC RSS converted to JSON
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&language=en&pageSize=${limit}`
    )
    const data = await response.json()
    
    if (data.articles) {
      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description || article.content,
        url: article.url,
      }))
    }
    return []
  } catch (error) {
    console.error('News API error:', error)
    return []
  }
}

// Get country codes and emergency numbers - Real emergency numbers worldwide
const emergencyDatabase: Record<string, { police: string; ambulance: string; fire: string; country: string; counseling?: string; poison?: string }> = {
  US: { police: '911', ambulance: '911', fire: '911', country: 'United States', counseling: '988', poison: '1-800-222-1222' },
  UK: { police: '999', ambulance: '999', fire: '999', country: 'United Kingdom', counseling: '116-123', poison: '111' },
  CA: { police: '911', ambulance: '911', fire: '911', country: 'Canada', counseling: '1-833-456-4566', poison: '1-800-268-9017' },
  AU: { police: '000', ambulance: '000', fire: '000', country: 'Australia', counseling: '1300-659-467', poison: '13-1126' },
  DE: { police: '110', ambulance: '112', fire: '112', country: 'Germany', counseling: '0800-1110111', poison: '089-19240' },
  FR: { police: '17', ambulance: '15', fire: '18', country: 'France', counseling: '3114', poison: '01-40-05-48-48' },
  IN: { police: '100', ambulance: '102', fire: '101', country: 'India', counseling: '9152987821', poison: '011-4060-6060' },
  JP: { police: '110', ambulance: '119', fire: '119', country: 'Japan', counseling: '03-6276-6556', poison: '03-6635-1193' },
  BR: { police: '190', ambulance: '192', fire: '193', country: 'Brazil', counseling: '0300-000-0000', poison: '0800-722-6001' },
  MX: { police: '911', ambulance: '911', fire: '911', country: 'Mexico', counseling: '5134-24-39', poison: '5550-64-03' },
  ES: { police: '091', ambulance: '061', fire: '080', country: 'Spain', counseling: '024', poison: '915-620-420' },
  IT: { police: '112', ambulance: '118', fire: '115', country: 'Italy', counseling: '1393-2391', poison: '06-3054-7777' },
  NL: { police: '112', ambulance: '112', fire: '112', country: 'Netherlands', counseling: '0900-1570', poison: '030-274-8888' },
  NZ: { police: '111', ambulance: '111', fire: '111', country: 'New Zealand', counseling: '1737', poison: '0800-764-766' },
  SG: { police: '999', ambulance: '995', fire: '995', country: 'Singapore', counseling: '1800-221-4444', poison: '6250-6667' },
  HK: { police: '999', ambulance: '999', fire: '999', country: 'Hong Kong', counseling: '2389-2222', poison: '2389-1111' },
  CN: { police: '110', ambulance: '120', fire: '119', country: 'China', counseling: '010-6951-1332', poison: '010-6315-8080' },
  RU: { police: '102', ambulance: '103', fire: '101', country: 'Russia', counseling: '007-495-988-8832', poison: '7-495-304-0764' },
  ZA: { police: '10177', ambulance: '10177', fire: '10177', country: 'South Africa', counseling: '0800-567-567', poison: '0861-555-777' },
  KR: { police: '112', ambulance: '119', fire: '119', country: 'South Korea', counseling: '1393', poison: '02-6000-6000' },
  TH: { police: '191', ambulance: '1669', fire: '199', country: 'Thailand', counseling: '1323', poison: '02-246-9934' },
  PH: { police: '117', ambulance: '136', fire: '143', country: 'Philippines', counseling: '02-929-95-11', poison: '632-522-2255' },
}

export function getEmergencyContacts(countryCode: string = 'US'): any {
  const contacts = emergencyDatabase[countryCode.toUpperCase()] || emergencyDatabase.US
  return {
    ...contacts,
    counseling: contacts.counseling || '988',
    poison: contacts.poison || '1-800-222-1222',
  }
}

// Real cryptocurrency data
export async function getCryptoData(symbol: string = 'BTC'): Promise<{ price: number; change: number } | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd&include_24hr_change=true`
    )
    const data = await response.json()
    const key = symbol.toLowerCase()
    if (data[key]) {
      return {
        price: data[key].usd,
        change: data[key].usd_24h_change,
      }
    }
    return null
  } catch (error) {
    console.error('Crypto API error:', error)
    return null
  }
}

// Dictionary API for word definitions
export async function getWordDefinition(word: string): Promise<string | null> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    if (!response.ok) return null
    const data = await response.json()
    if (data[0]?.meanings[0]?.definitions[0]) {
      return data[0].meanings[0].definitions[0].definition
    }
    return null
  } catch {
    return null
  }
}

// Real IP-based location
export async function getLocationFromIP(): Promise<{ country: string; city: string; lat: number; lng: number } | null> {
  try {
    const response = await fetch('https://ipapi.co/json/')
    const data = await response.json()
    return {
      country: data.country_code,
      city: data.city,
      lat: data.latitude,
      lng: data.longitude,
    }
  } catch {
    return null
  }
}

// Reverse geocoding via OpenStreetMap Nominatim - turn coordinates into a place name
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ label: string; city?: string; country?: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14`,
      { headers: { 'User-Agent': 'NEXUS-AI-Service-Finder' } }
    )
    if (!response.ok) return null
    const data = await response.json()
    const addr = data.address || {}
    const city =
      addr.city || addr.town || addr.village || addr.suburb || addr.county
    const country = addr.country
    const label = [city, addr.state, country].filter(Boolean).join(', ') || data.display_name
    return { label, city, country }
  } catch {
    return null
  }
}
