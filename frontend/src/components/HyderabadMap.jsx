import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// Fix default icon paths for Leaflet in Vite bundler
const DefaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const HYDERABAD_CENTER = [17.385044, 78.486671]

const ClickHandler = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      if (onSelect) {
        onSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng
        })
      }
    }
  })
  return null
}

/**
 * Generic Hyderabad map component
 * - centerOn: optional { lat, lng } to center; defaults to Hyderabad
 * - marker: optional { lat, lng }
 * - markers: optional array of { id, lat, lng, color?, popupContent? }
 * - onSelect: called when user clicks on the map (for scheduling pickup)
 */
const HyderabadMap = ({
  height = '320px',
  centerOn,
  marker,
  markers = [],
  onSelect
}) => {
  const center = centerOn && centerOn.lat && centerOn.lng
    ? [centerOn.lat, centerOn.lng]
    : HYDERABAD_CENTER

  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onSelect && <ClickHandler onSelect={onSelect} />}

        {marker && marker.lat && marker.lng && (
          <Marker position={[marker.lat, marker.lng]} icon={DefaultIcon}>
            <Popup>Pickup location</Popup>
          </Marker>
        )}

        {markers.map((m) => {
          if (!m.lat || !m.lng) return null

          let icon
          if (m.color) {
            icon = L.divIcon({
              className: '',
              html: `<span style="
                display:inline-block;
                width:16px;
                height:16px;
                border-radius:999px;
                background:${m.color};
                border:2px solid white;
                box-shadow:0 0 0 1px rgba(0,0,0,0.3);
              "></span>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })
          }

          return (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={icon || DefaultIcon}>
              {m.popupContent && <Popup>{m.popupContent}</Popup>}
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default HyderabadMap

