import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';

let socket = null;

export const initializeSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  return socket || initializeSocket();
};

export const connectSocket = (userId) => {
  const sock = getSocket();
  if (!sock.connected) {
    sock.connect();
  }
  sock.emit('user-online', userId);
};

export const disconnectSocket = (userId) => {
  const sock = getSocket();
  if (sock) {
    sock.emit('user-offline', userId);
    sock.disconnect();
    socket = null;
  }
};

export const sendMessageViaSocket = (senderId, receiverId, content) => {
  const sock = getSocket();
  sock.emit('send-message', {
    senderId,
    receiverId,
    content,
    timestamp: new Date().toISOString()
  });
};

export const startTyping = (senderId, receiverId) => {
  const sock = getSocket();
  sock.emit('user-typing', {
    senderId,
    receiverId
  });
};

export const stopTyping = (senderId, receiverId) => {
  const sock = getSocket();
  sock.emit('user-stopped-typing', {
    senderId,
    receiverId
  });
};

export const markMessageAsRead = (senderId, receiverId, messageId) => {
  const sock = getSocket();
  sock.emit('message-read', {
    senderId,
    receiverId,
    messageId
  });
};

export const joinConversation = (conversationId) => {
  const sock = getSocket();
  sock.emit('join-conversation', conversationId);
};

export const leaveConversation = (conversationId) => {
  const sock = getSocket();
  sock.emit('leave-conversation', conversationId);
};

export const onReceiveMessage = (callback) => {
  const sock = getSocket();
  sock.on('receive-message', callback);
};

export const onMessageRead = (callback) => {
  const sock = getSocket();
  sock.on('message-read-notification', callback);
};

export const onUserTypingIndicator = (callback) => {
  const sock = getSocket();
  sock.on('user-typing-indicator', callback);
};

export const onUserStatusChanged = (callback) => {
  const sock = getSocket();
  sock.on('user-status-changed', callback);
};

export const removeMessageListener = () => {
  const sock = getSocket();
  sock.off('receive-message');
};

export const removeReadListener = () => {
  const sock = getSocket();
  sock.off('message-read-notification');
};

export const removeTypingListener = () => {
  const sock = getSocket();
  sock.off('user-typing-indicator');
};

export const removeStatusListener = () => {
  const sock = getSocket();
  sock.off('user-status-changed');
};
