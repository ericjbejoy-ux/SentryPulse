'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const greenChargerIcon = L.divIcon({
  className: 'custom-green-marker',
  html: `<div style="background-color: #10B981; width: 26px; height: 26px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 0 10px rgba(16,185,129,0.8); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">⚡</div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
})

function ChangeView({ bounds }: { bounds: any }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [bounds, map])
  return null
}

export default function Map({ startCoords, endCoords, routePolyline, chargers }: any) {
  const center = startCoords ? [startCoords.lat, startCoords.lng] : [19.0760, 72.8777]
  let bounds = null

  if (startCoords && endCoords) {
    bounds = L.latLngBounds(
      [startCoords.lat, startCoords.lng],
      [endCoords.lat, endCoords.lng]
    )
  }

  return (
    <MapContainer center={center as [number, number]} zoom={6} className="w-full h-full rounded-xl">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {bounds && <ChangeView bounds={bounds} />}
      {startCoords && <Marker position={[startCoords.lat, startCoords.lng]} />}
      {endCoords && <Marker position={[endCoords.lat, endCoords.lng]} />}
      {routePolyline && <Polyline positions={routePolyline} color="#3B82F6" weight={5} opacity={0.8} />}
      
      {chargers && chargers.map((station: any, idx: number) => (
        <Marker
          key={idx}
          position={[station.AddressInfo.Latitude, station.AddressInfo.Longitude]}
          icon={greenChargerIcon}
        >
          <Popup>
            <div className="text-black font-sans">
              <strong>{station.AddressInfo.Title}</strong><br/>
              {station.AddressInfo.AddressLine1}<br/>
              <span className="text-green-600 font-bold">EV Charger Available</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
