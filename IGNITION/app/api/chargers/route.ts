import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startLat = searchParams.get('startLat')
  const startLng = searchParams.get('startLng')
  const endLat = searchParams.get('endLat')
  const endLng = searchParams.get('endLng')

  if (!startLat || !startLng || !endLat || !endLng) {
    return NextResponse.json([])
  }

  const apiKey = process.env.NEXT_PUBLIC_OPENCHARGEMAP_KEY || ''
  
  // Sample 3 coordinates along the path (Start, Mid, End)
  const sLat = parseFloat(startLat)
  const sLng = parseFloat(startLng)
  const eLat = parseFloat(endLat)
  const eLng = parseFloat(endLng)
  const mLat = (sLat + eLat) / 2
  const mLng = (sLng + eLng) / 2

  const points = [
    { lat: sLat, lng: sLng },
    { lat: mLat, lng: mLng },
    { lat: eLat, lng: eLng }
  ]

  try {
    const promises = points.map(pt =>
      fetch(
        `https://api.openchargemap.io/v3/poi/?output=json&latitude=${pt.lat}&longitude=${pt.lng}&distance=60&distanceunit=KM&maxresults=15&key=${apiKey}`,
        { headers: { 'User-Agent': 'IgnitionEV/1.0' } }
      ).then(r => r.ok ? r.json() : [])
    )

    const results = await Promise.all(promises)
    const combined = results.flat()

    // Deduplicate by Station ID
    const uniqueStations = Array.from(
      new Map(combined.map(item => [item.ID, item])).values()
    )

    return NextResponse.json(uniqueStations)
  } catch (err) {
    return NextResponse.json([])
  }
}
