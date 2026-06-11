import { getEmergencyContacts, getLocationFromIP } from '@/lib/real-api-services'

interface EmergencyData {
  country: string
  police: string
  ambulance: string
  fire: string
  counseling: string
  poison: string
}

export async function POST(request: Request) {
  try {
    const { countryCode } = await request.json()

    // If no country code provided, try to get it from IP
    let code = countryCode || 'US'
    if (!countryCode) {
      const location = await getLocationFromIP()
      if (location) {
        code = location.country
      }
    }

    // Get real emergency numbers
    const emergencyData = getEmergencyContacts(code)

    return Response.json({
      id: crypto.randomUUID(),
      ...emergencyData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Emergency API error:', error)
    return Response.json({ error: 'Failed to get emergency contacts' }, { status: 500 })
  }
}
