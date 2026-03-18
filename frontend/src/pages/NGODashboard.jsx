import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import {
  ClipboardList,
  UserCheck,
  Users,
  MessageCircle,
  CheckCircle,
  UserPlus,
  ChevronRight,
  MapPin,
  Calendar
} from 'lucide-react'

const NGODashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('open') // 'open' | 'accepted' | 'volunteers'
  const [openOpportunities, setOpenOpportunities] = useState([])
  const [acceptedOpportunities, setAcceptedOpportunities] = useState([])
  const [volunteers, setVolunteers] = useState([])
  const [matchedVolunteersByOpportunity, setMatchedVolunteersByOpportunity] = useState({})
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState(null)
  const [assigningId, setAssigningId] = useState(null)
  const [selectedVolunteerId, setSelectedVolunteerId] = useState({})

  useEffect(() => {
    setLoading(true)
    if (activeTab === 'open') {
      // For NGOs, this returns opportunities in pending_review status
      api.get('/opportunities/match/recommended').then(res => {
        setOpenOpportunities(res.data.data || [])
      }).catch(() => setOpenOpportunities([])).finally(() => setLoading(false))
    } else if (activeTab === 'accepted') {
      Promise.all([
        api.get('/opportunities/admin/my-opportunities'),
        api.get('/agents/volunteers').catch(() => ({ data: { data: [] } }))
      ]).then(([oppRes, volRes]) => {
        const acceptedItems = oppRes.data.data || []
        setAcceptedOpportunities(acceptedItems)
        setVolunteers(volRes.data?.data || [])

        const matchRequests = acceptedItems
          .filter(opp => opp.status === 'accepted')
          .map(opp =>
            api.get(`/opportunities/${opp._id}/volunteer-matches?limit=20`)
              .then(res => ({ oppId: opp._id, matches: res.data?.data || [] }))
              .catch(() => ({ oppId: opp._id, matches: [] }))
          )

        if (matchRequests.length > 0) {
          Promise.all(matchRequests).then((results) => {
            const byOpp = {}
            results.forEach(({ oppId, matches }) => {
              byOpp[oppId] = matches
            })
            setMatchedVolunteersByOpportunity(byOpp)
          })
        } else {
          setMatchedVolunteersByOpportunity({})
        }
      }).catch(() => setAcceptedOpportunities([])).finally(() => setLoading(false))
    } else {
      api.get('/agents/volunteers').then(res => {
        setVolunteers(res.data.data || [])
      }).catch(() => setVolunteers([])).finally(() => setLoading(false))
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'open' && openOpportunities.length === 0) setLoading(false)
  }, [activeTab, openOpportunities.length])

  const handleAccept = async (oppId) => {
    setAcceptingId(oppId)
    try {
      await api.post(`/opportunities/${oppId}/accept`)
      toast.success('Opportunity approved. You can now assign volunteers.')
      setOpenOpportunities(prev => prev.filter(o => o._id !== oppId))
      if (activeTab === 'accepted') {
        const res = await api.get('/opportunities/admin/my-opportunities')
        setAcceptedOpportunities(res.data.data || [])
        const refreshedMatches = await api
          .get(`/opportunities/${oppId}/volunteer-matches?limit=20`)
          .then(r => r.data?.data || [])
          .catch(() => [])
        setMatchedVolunteersByOpportunity(prev => ({
          ...prev,
          [oppId]: refreshedMatches
        }))
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to accept')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleReject = async (oppId) => {
    const reason = window.prompt('Optional: provide a reason for rejection')
    try {
      await api.post(`/opportunities/${oppId}/reject`, { reason })
      toast.success('Opportunity rejected')
      setOpenOpportunities(prev => prev.filter(o => o._id !== oppId))
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to reject')
    }
  }

  const handleAssign = async (oppId) => {
    const volunteerId = selectedVolunteerId[oppId]
    if (!volunteerId) {
      toast.error('Select a volunteer first')
      return
    }
    setAssigningId(oppId)
    try {
      await api.post(`/opportunities/${oppId}/assign`, { volunteerId })
      toast.success('Volunteer assigned.')
      setSelectedVolunteerId(prev => ({ ...prev, [oppId]: null }))
      if (activeTab === 'accepted') {
        const res = await api.get('/opportunities/admin/my-opportunities')
        setAcceptedOpportunities(res.data.data || [])
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to assign')
    } finally {
      setAssigningId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">NGO Coordinator Dashboard</h1>
        <p className="text-emerald-100">Review opportunities, approve and assign volunteers</p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => navigate('/messages')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <MessageCircle className="w-5 h-5" />
            Messages
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'open', label: 'Pending review', icon: ClipboardList },
          { id: 'accepted', label: 'Assigned & completed', icon: CheckCircle },
          { id: 'volunteers', label: 'Volunteers', icon: Users }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition ${
              activeTab === id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {activeTab === 'open' && (
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Pending review (approve to coordinate)</h2>
              {openOpportunities.length === 0 ? (
                <p className="text-gray-500 py-4">No opportunities pending review at the moment.</p>
              ) : (
                openOpportunities.map(opp => (
                  <div
                    key={opp._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{opp.description}</p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                        {opp.location?.address && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {opp.location.address}</span>
                        )}
                        {opp.startDate && (
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(opp.startDate).toLocaleDateString()} - {new Date(opp.endDate).toLocaleDateString()}</span>
                        )}
                        {opp.createdBy?.name && <span>By {opp.createdBy.name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(opp._id)}
                        disabled={acceptingId === opp._id}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {acceptingId === opp._id ? 'Approving...' : (
                          <> <CheckCircle className="w-4 h-4" /> Approve </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(opp._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'accepted' && (
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Accepted, assigned, and completed opportunities</h2>
              {acceptedOpportunities.length === 0 ? (
                <p className="text-gray-500 py-4">You have not accepted any opportunities yet.</p>
              ) : (
                acceptedOpportunities.map(opp => (
                  <div
                    key={opp._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <h3 className="font-semibold text-gray-900">{opp.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">Status: {opp.status}</p>
                    <p className="text-sm text-gray-600 mt-1">{opp.description?.slice(0, 120)}...</p>
                    {opp.status === 'accepted' && (
                      <p className="text-xs text-emerald-700 mt-2">
                        Suggestions ranked by waste-type match and volunteer distance.
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {(() => {
                        const matchedVolunteers = matchedVolunteersByOpportunity[opp._id] || []
                        const volunteersForOpportunity = matchedVolunteers.length > 0 ? matchedVolunteers : volunteers
                        return (
                      <select
                        value={selectedVolunteerId[opp._id] || ''}
                        onChange={e => setSelectedVolunteerId(prev => ({ ...prev, [opp._id]: e.target.value || null }))}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Select volunteer</option>
                        {volunteersForOpportunity.map(v => (
                          <option key={v.userId} value={v.userId}>
                            {v.name} ({v.email})
                            {typeof v.score === 'number' ? ` - ${Math.round(v.score * 100)}% match` : ''}
                            {typeof v.distanceKm === 'number' ? `, ${v.distanceKm.toFixed(1)} km` : ''}
                          </option>
                        ))}
                      </select>
                        )
                      })()}
                      <button
                        onClick={() => handleAssign(opp._id)}
                        disabled={assigningId === opp._id || !selectedVolunteerId[opp._id]}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                      >
                        {assigningId === opp._id ? 'Assigning...' : (
                          <> <UserPlus className="w-4 h-4" /> Assign </>
                        )}
                      </button>
                    </div>
                    {opp.assignedTo?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">Assigned: {opp.assignedTo.map(a => a.volunteer?.name).filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'volunteers' && (
            <div className="grid gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Volunteers (assign tasks from Accepted tab)</h2>
              {volunteers.length === 0 ? (
                <p className="text-gray-500 py-4">No volunteers registered yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Skills</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volunteers.map(v => (
                        <tr key={v.userId} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">{v.name}</td>
                          <td className="px-4 py-3 text-gray-600">{v.email}</td>
                          <td className="px-4 py-3 text-sm">{Array.isArray(v.skills) ? v.skills.join(', ') : '—'}</td>
                          <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-gray-100">{v.status || '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NGODashboard
