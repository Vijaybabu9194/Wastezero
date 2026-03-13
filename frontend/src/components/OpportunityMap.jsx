import HyderabadMap from './HyderabadMap'

/**
 * Map for user opportunities.
 * - Shows only non-completed/non-rejected opportunities with coordinates
 * - Colors pins based on status:
 *   pending_review (orange), accepted (blue), assigned (purple), in_progress (yellow)
 */
const OpportunityMap = ({ opportunities = [], height = '360px' }) => {
  const statusColor = (status) => {
    const map = {
      pending_review: '#f59e0b', // amber
      accepted: '#3b82f6',       // blue
      assigned: '#8b5cf6',       // purple
      in_progress: '#facc15'     // yellow
    }
    return map[status] || '#6b7280' // gray
  }

  const markers = (opportunities || [])
    .filter((opp) => opp.status && !['completed', 'rejected', 'cancelled'].includes(opp.status))
    .filter((opp) => opp.location?.coordinates?.lat && opp.location?.coordinates?.lng)
    .map((opp) => ({
      id: opp._id,
      lat: opp.location.coordinates.lat,
      lng: opp.location.coordinates.lng,
      color: statusColor(opp.status),
      popupContent: (
        <div className="space-y-1 text-sm">
          <div className="font-semibold">
            {opp.title}
          </div>
          {opp.location?.address && (
            <div>{opp.location.address}</div>
          )}
          {opp.startDate && (
            <div>{new Date(opp.startDate).toLocaleDateString()} – {new Date(opp.endDate).toLocaleDateString()}</div>
          )}
          <div className="text-xs text-gray-500">
            Status: {opp.status.replace('_', ' ')}
          </div>
        </div>
      )
    }))

  if (!markers.length) {
    return (
      <div className="card text-sm text-gray-500">
        No opportunities to show on the map yet.
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        My Opportunities Map
      </h2>
      <HyderabadMap markers={markers} height={height} />
    </div>
  )
}

export default OpportunityMap

