import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length < 2) {
    return NextResponse.json([])
  }

  try {
    // Komoot Photon engine (OpenStreetMap Autocomplete with high throughput)
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    })

    if (!response.ok) {
      console.error(`Photon Error: ${response.status} ${response.statusText}`)
      return NextResponse.json([])
    }

    const data = await response.json()
    
    // Map Photon GeoJSON features to standardized dropdown items
    const formattedResults = (data.features || []).map((feat: any) => {
      const props = feat.properties || {}
      const coords = feat.geometry?.coordinates || [0, 0] // [lng, lat]
      
      const nameParts = [props.name, props.street, props.city, props.state, props.country].filter(Boolean)
      const label = nameParts.join(', ') || props.name || 'Unknown Location'

      return {
        display_name: label,
        lat: coords[1],
        lon: coords[0]
      }
    })

    return NextResponse.json(formattedResults)
  } catch (error) {
    console.error("Geocoding fetch exception:", error)
    return NextResponse.json([])
  }
}
