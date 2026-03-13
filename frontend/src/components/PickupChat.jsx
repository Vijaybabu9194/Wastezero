import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { messageApi } from '../utils/api'
import { getSocket, connectSocket } from '../utils/socket'
import toast from 'react-hot-toast'
import { Send, MessageCircle, Lock, AlertCircle } from 'lucide-react'

const PickupChat = ({ pickupId, pickup, onClose }) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const socket = getSocket()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Fetch message history
  useEffect(() => {
    const fetchMessages = async () => {
      if (!pickupId) return
      try {
        setLoading(true)
        const response = await messageApi.getPickupMessages(pickupId)
        const pickupMessages = (response.data?.messages || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )
        setMessages(pickupMessages)
      } catch (error) {
        console.error('Error loading messages:', error)
        setMessages([])
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [pickupId])

  // Socket.io setup for real-time messages
  useEffect(() => {
    if (!pickupId || !user?._id) return

    // Connect socket if needed
    if (!socket.connected) {
      connectSocket(user._id)
    }

    // Join pickup chat room
    socket.emit('join-pickup-chat', { pickupId, userId: user._id })

    // Listen for incoming messages
    socket.on(`message-${pickupId}`, (message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    // Listen for typing indicators
    socket.on(`typing-${pickupId}`, (data) => {
      // Optional: Show typing indicator
      console.log(`${data.userName} is typing...`)
    })

    return () => {
      socket.emit('leave-pickup-chat', { pickupId })
      socket.off(`message-${pickupId}`)
      socket.off(`typing-${pickupId}`)
    }
  }, [pickupId, user?._id, socket])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    
    if (!newMessage.trim()) {
      toast.error('Message cannot be empty')
      return
    }

    // Check if chat should be locked (pickup is assigned)
    if (pickup?.status === 'assigned' && pickup?.agentId !== user._id) {
      toast.error('Chat is locked for assigned pickups')
      return
    }

    setSending(true)
    try {
      const recipientId =
        user?.role === 'agent'
          ? pickup?.userId?._id
          : pickup?.agentId

      const response = await messageApi.sendMessage({
        recipientId,
        content: newMessage,
        pickupId
      })

      // Add message to local state immediately
      setMessages(prev => [...prev, response.data])
      setNewMessage('')
      
      // Emit real-time message via Socket.io
      socket.emit('send-pickup-message', {
        pickupId,
        message: response.data
      })

      scrollToBottom()
    } catch (error) {
      toast.error('Failed to send message')
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const isReadOnly = pickup?.status !== 'scheduled'

  const isUserAgent = user?.role === 'agent'
  const otherUser = isUserAgent ? pickup?.userId : pickup?.agentId

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">
              Chat about Pickup
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              {isUserAgent ? `User: ${pickup?.userId?.name}` : `Agent: ${pickup?.agentId?.name || 'Pending Assignment'}`}
            </p>
          </div>
          {pickup?.status !== 'scheduled' && (
            <span className={`px-2 py-1 text-xs font-semibold rounded ${
              pickup?.status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {pickup?.status}
            </span>
          )}
        </div>
      </div>

      {/* Lock Warning */}
      {isReadOnly && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-yellow-600" />
          <p className="text-xs text-yellow-700">
            Chat is read-only. This pickup is assigned to another agent.
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isOwnMessage = msg.senderId === user?._id
              return (
                <div
                  key={msg._id || msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {!isReadOnly ? (
        <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-center">
          <p className="text-xs text-gray-600 flex items-center gap-2 justify-center">
            <Lock size={14} />
            Chat is locked
          </p>
        </div>
      )}
    </div>
  )
}

export default PickupChat
