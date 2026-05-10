export interface MapCity {
  name:   string
  lat:    number
  lng:    number
  stage:  number
  size?:  number
}

export const MAP_CITIES: MapCity[] = [
  // Stage 0 — Origin
  { name: 'Lisbon',         lat:  38.72, lng:  -9.14, stage: 0, size: 2.0 },

// Stage 1 — Europe (reduced and spread)
{ name: 'London',        lat:  51.51, lng:  -0.13, stage: 1 },
{ name: 'Paris',         lat:  48.86, lng:   2.35, stage: 1 },
{ name: 'Berlin',        lat:  52.52, lng:  13.40, stage: 1 },
{ name: 'Stockholm',     lat:  59.33, lng:  18.07, stage: 1 },
{ name: 'Rome',          lat:  41.90, lng:  12.50, stage: 1 },

  // Stage 2 — West Africa
  { name: 'Lagos',          lat:   6.52, lng:   3.38, stage: 2, size: 1.5 },
  { name: 'Accra',          lat:   5.56, lng:  -0.20, stage: 2 },
  { name: 'Abidjan',        lat:   5.35, lng:  -4.00, stage: 2 },
  { name: 'Dakar',          lat:  14.72, lng: -17.47, stage: 2 },
  { name: 'Abuja',          lat:   9.07, lng:   7.40, stage: 2 },
  { name: 'Freetown',       lat:   8.49, lng: -13.23, stage: 2 },

  // Stage 3 — East & Southern Africa
  { name: 'Nairobi',        lat:  -1.29, lng:  36.82, stage: 3 },
  { name: 'Johannesburg',   lat: -26.20, lng:  28.04, stage: 3 },
  { name: 'Cape Town',      lat: -33.93, lng:  18.42, stage: 3 },
  { name: 'Addis Ababa',    lat:   9.03, lng:  38.74, stage: 3 },
  { name: 'Kampala',        lat:   0.32, lng:  32.58, stage: 3 },

  // Stage 4 — North America
  { name: 'New York',       lat:  40.71, lng: -74.01, stage: 4 },
  { name: 'Toronto',        lat:  43.65, lng: -79.38, stage: 4 },
  { name: 'Washington DC',  lat:  38.91, lng: -77.04, stage: 4 },
  { name: 'Atlanta',        lat:  33.75, lng: -84.39, stage: 4 },
  { name: 'Houston',        lat:  29.76, lng: -95.37, stage: 4 },
  { name: 'Chicago',        lat:  41.88, lng: -87.63, stage: 4 },
  { name: 'Los Angeles',    lat:  34.05, lng:-118.24, stage: 4 },
  { name: 'Montreal',       lat:  45.50, lng: -73.57, stage: 4 },

  // Stage 5 — South America
  { name: 'São Paulo',      lat: -23.55, lng: -46.63, stage: 5 },
  { name: 'Rio de Janeiro', lat: -22.91, lng: -43.17, stage: 5 },
  { name: 'Buenos Aires',   lat: -34.60, lng: -58.38, stage: 5 },
  { name: 'Bogotá',         lat:   4.71, lng: -74.07, stage: 5 },
  { name: 'Lima',           lat: -12.05, lng: -77.04, stage: 5 },

  // Stage 6 — Middle East & South Asia
  { name: 'Dubai',          lat:  25.20, lng:  55.27, stage: 6 },
  { name: 'Riyadh',         lat:  24.69, lng:  46.72, stage: 6 },
  { name: 'Mumbai',         lat:  19.08, lng:  72.88, stage: 6 },
  { name: 'Delhi',          lat:  28.61, lng:  77.21, stage: 6 },
  { name: 'Karachi',        lat:  24.86, lng:  67.01, stage: 6 },

  // Stage 7 — Asia Pacific
  { name: 'Singapore',      lat:   1.35, lng: 103.82, stage: 7 },
  { name: 'Kuala Lumpur',   lat:   3.14, lng: 101.69, stage: 7 },
  { name: 'Tokyo',          lat:  35.69, lng: 139.69, stage: 7 },
  { name: 'Seoul',          lat:  37.57, lng: 126.98, stage: 7 },
  { name: 'Sydney',         lat: -33.87, lng: 151.21, stage: 7 },
  { name: 'Melbourne',      lat: -37.81, lng: 144.96, stage: 7 },

  // Stage 8 — Global coverage
  { name: 'Cairo',          lat:  30.04, lng:  31.24, stage: 8 },
  { name: 'Casablanca',     lat:  33.57, lng:  -7.59, stage: 8 },
  { name: 'Moscow',         lat:  55.75, lng:  37.62, stage: 8 },
  { name: 'Istanbul',       lat:  41.01, lng:  28.95, stage: 8 },
  { name: 'Mexico City',    lat:  19.43, lng: -99.13, stage: 8 },
  { name: 'Santiago',       lat: -33.45, lng: -70.67, stage: 8 },
  { name: 'Auckland',       lat: -36.85, lng: 174.76, stage: 8 },
]

export const STAGE_DELAYS: Record<number, number> = {
  0: 0,      // Lisbon
  1: 800,    // Europe
  2: 1800,   // West Africa
  3: 2600,   // East & Southern Africa
  4: 3400,   // North America
  5: 4200,   // South America
  6: 5000,   // Middle East & South Asia
  7: 5800,   // Asia Pacific
  8: 6600,   // Global coverage
}

export const LOOP_DELAY      = 9000
export const IDLE_LOOP_DELAY = 15000