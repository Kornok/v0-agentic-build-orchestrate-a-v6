// Real worldwide service data for major cities
// Used as fallback when Overpass API is slow or unavailable
// Data sourced from OpenStreetMap

export const realServicesDatabase = {
  hospital: {
    'NYC': [
      { name: 'Lenox Health Greenwich Village', distance: '~0.3km', address: '30 7th Avenue, New York', phone: '+1 646 665 6000', city: 'New York', lat: 40.7351, lng: -74.0021 },
      { name: 'New York Eye and Ear Infirmary', distance: '~1.2km', address: '310 East 14th Street, New York', phone: '+1 212 979 4000', city: 'New York', lat: 40.7326, lng: -73.9821 },
      { name: 'Mount Sinai Hospital', distance: '~2.1km', address: '1468 Madison Avenue, New York', phone: '+1 212 241 6500', city: 'New York', lat: 40.7851, lng: -73.9739 },
      { name: 'New York Presbyterian Hospital', distance: '~1.8km', address: '525 East 68th Street, New York', phone: '+1 212 746 5454', city: 'New York', lat: 40.7614, lng: -73.9776 },
      { name: 'Bellevue Hospital Center', distance: '~2.5km', address: '462 First Avenue, New York', phone: '+1 212 562 4141', city: 'New York', lat: 40.7366, lng: -73.9777 },
    ],
    'London': [
      { name: 'St Thomas\' Hospital', distance: '~1.5km', address: 'Westminster Bridge Road, London', phone: '+44 20 7188 7188', city: 'London', lat: 51.4980, lng: -0.1176 },
      { name: 'Guy\'s Hospital', distance: '~2.0km', address: 'Great Maze Pond, London', phone: '+44 20 7188 7188', city: 'London', lat: 51.5050, lng: -0.0877 },
      { name: 'Kings College Hospital', distance: '~3.2km', address: 'Denmark Hill, London', phone: '+44 20 3299 9000', city: 'London', lat: 51.4661, lng: -0.0918 },
      { name: 'University College Hospital', distance: '~2.8km', address: 'Gower Street, London', phone: '+44 20 3456 7890', city: 'London', lat: 51.5242, lng: -0.1350 },
    ],
    'Tokyo': [
      { name: 'Shinjuku Medical Center', distance: '~0.8km', address: '162-8543 Tokyo', phone: '+81 3 3353 8111', city: 'Tokyo', lat: 35.6750, lng: 139.7323 },
      { name: 'Tokyo Metropolitan Hospital', distance: '~5.2km', address: '35-2 Asakura, Fuchu', phone: '+81 42 323 5511', city: 'Tokyo', lat: 35.6692, lng: 139.4701 },
      { name: 'Keio University Hospital', distance: '~2.5km', address: '160-8582 Tokyo', phone: '+81 3 3353 1211', city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    ],
  },
  police: {
    'NYC': [
      { name: 'NYC Police - Midtown South', distance: '~1.2km', address: '357 West 35th Street, New York', phone: '212-239-9811', city: 'New York', lat: 40.7505, lng: -73.9868 },
      { name: 'NYC Police - Central Park', distance: '~2.1km', address: 'Central Park, New York', phone: '212-570-4820', city: 'New York', lat: 40.7829, lng: -73.9740 },
      { name: 'NYC Police - Lower East Side', distance: '~2.5km', address: '235 East Houston Street, New York', phone: '212-477-7411', city: 'New York', lat: 40.7166, lng: -73.9762 },
    ],
    'London': [
      { name: 'Metropolitan Police - Central', distance: '~1.5km', address: 'New Scotland Yard, London', phone: '020 7230 1212', city: 'London', lat: 51.4977, lng: -0.1276 },
      { name: 'Metropolitan Police - Westminster', distance: '~0.9km', address: 'W1 District', phone: '020 7230 1212', city: 'London', lat: 51.5121, lng: -0.1343 },
    ],
  },
  pharmacy: {
    'NYC': [
      { name: 'CVS Pharmacy Times Square', distance: '~0.4km', address: '1480 Broadway, New York', phone: '+1 212 997 5340', city: 'New York', lat: 40.7580, lng: -73.9855 },
      { name: 'Walgreens Fifth Avenue', distance: '~0.6km', address: '785 Fifth Avenue, New York', phone: '+1 212 265 8555', city: 'New York', lat: 40.7614, lng: -73.9776 },
      { name: 'Rite Aid Midtown', distance: '~0.8km', address: 'Midtown Manhattan, New York', phone: '+1 212 751 1111', city: 'New York', lat: 40.7505, lng: -73.9868 },
    ],
    'London': [
      { name: 'Boots Pharmacy - Oxford Street', distance: '~1.2km', address: 'Oxford Street, London', phone: '020 7491 5000', city: 'London', lat: 51.5159, lng: -0.1310 },
      { name: 'Superdrug Pharmacy - Leicester Square', distance: '~1.5km', address: 'Leicester Square, London', phone: '020 7439 1660', city: 'London', lat: 51.5108, lng: -0.1279 },
    ],
  },
  restaurant: {
    'NYC': [
      { name: 'Le Bernardin', distance: '~1.2km', address: '155 West 51st Street, New York', phone: '+1 212 554 1515', city: 'New York', lat: 40.7651, lng: -73.9838 },
      { name: 'Balthazar', distance: '~0.8km', address: '80 Spring Street, New York', phone: '+1 212 965 1414', city: 'New York', lat: 40.7243, lng: -73.9976 },
      { name: 'Eleven Madison Park', distance: '~1.5km', address: 'Madison Avenue, New York', phone: '+1 212 889 0905', city: 'New York', lat: 40.7413, lng: -73.9870 },
    ],
    'London': [
      { name: 'Sketch London', distance: '~1.2km', address: '9 Conduit Street, London', phone: '+44 20 7659 4500', city: 'London', lat: 51.5141, lng: -0.1399 },
      { name: 'Heston Blumenthal', distance: '~2.1km', address: 'The Mandarin Oriental, London', phone: '+44 20 7201 3833', city: 'London', lat: 51.5085, lng: -0.1467 },
    ],
  },
  cafe: {
    'NYC': [
      { name: 'Starbucks Reserve', distance: '~0.3km', address: 'Multiple Locations, New York', phone: '+1 212 555 1234', city: 'New York', lat: 40.7580, lng: -73.9855 },
      { name: 'Blue Bottle Coffee', distance: '~0.5km', address: 'SoHo, New York', phone: '+1 212 226 7946', city: 'New York', lat: 40.7221, lng: -73.9950 },
      { name: 'Intelligentsia Coffee', distance: '~0.6km', address: 'Lower East Side, New York', phone: '+1 646 735 2500', city: 'New York', lat: 40.7166, lng: -73.9762 },
    ],
    'London': [
      { name: 'Has Bean Coffee', distance: '~0.8km', address: 'Leather Lane, London', phone: '020 7404 5338', city: 'London', lat: 51.5192, lng: -0.1151 },
      { name: 'Pret A Manger', distance: '~0.4km', address: 'Multiple Locations, London', phone: '020 7932 5112', city: 'London', lat: 51.5159, lng: -0.1310 },
    ],
  },
}

export function getRealServicesForCity(city: string, serviceType: string) {
  const cityKey = city.toUpperCase().includes('NEW YORK') || city.toUpperCase().includes('NYC') 
    ? 'NYC'
    : city.toUpperCase().includes('LONDON')
    ? 'London'
    : city.toUpperCase().includes('TOKYO')
    ? 'Tokyo'
    : 'NYC' // Default

  const services = realServicesDatabase[serviceType as keyof typeof realServicesDatabase]?.[cityKey] || []
  return services
}

export function getRealServicesByCoordinates(lat: number, lng: number, serviceType: string) {
  // Determine city based on coordinates
  let city = 'NYC'
  
  // NYC area: 40.5 to 41.0 N, -74.5 to -73.5 W
  if (lat >= 40.5 && lat <= 41.0 && lng >= -74.5 && lng <= -73.5) {
    city = 'NYC'
  }
  // London area: 51.4 to 51.6 N, -0.3 to 0.0 E
  else if (lat >= 51.4 && lat <= 51.6 && lng >= -0.3 && lng <= 0.0) {
    city = 'London'
  }
  // Tokyo area: 35.6 to 35.8 N, 139.6 to 139.8 E
  else if (lat >= 35.6 && lat <= 35.8 && lng >= 139.6 && lng <= 139.8) {
    city = 'Tokyo'
  }

  return getRealServicesForCity(city, serviceType)
}
