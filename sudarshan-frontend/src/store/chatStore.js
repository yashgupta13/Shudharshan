import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  rooms: [],
  currentRoomId: null,
  messages: {},        // { roomId: [message, ...] }
  typingUsers: {},     // { roomId: { userId: timestamp } }
  encryptionKeys: {},  // { roomId: { aesKey, dhKeyPair, peerPublicKey } }
  onlineUsers: {},     // { roomId: [userId, ...] }
  wsStatus: 'disconnected', // connected | disconnected | reconnecting

  // ─── Rooms ───────────────────────────────
  setRooms: (rooms) => set({ rooms }),

  addRoom: (room) => set((state) => ({
    rooms: state.rooms.find(r => r.id === room.id)
      ? state.rooms
      : [...state.rooms, room],
    messages: { ...state.messages, [room.id]: state.messages[room.id] || [] },
  })),

  removeRoom: (roomId) => set((state) => ({
    rooms: state.rooms.filter(r => r.id !== roomId),
    currentRoomId: state.currentRoomId === roomId ? null : state.currentRoomId,
  })),

  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),

  // ─── Messages ────────────────────────────
  addMessage: (roomId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [roomId]: [...(state.messages[roomId] || []), message],
    },
  })),

  setMessages: (roomId, messages) => set((state) => ({
    messages: { ...state.messages, [roomId]: messages },
  })),

  getCurrentMessages: () => {
    const { currentRoomId, messages } = get();
    return currentRoomId ? (messages[currentRoomId] || []) : [];
  },

  // ─── Typing indicators ───────────────────
  setTyping: (roomId, userId) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [roomId]: { ...(state.typingUsers[roomId] || {}), [userId]: Date.now() },
    },
  })),

  clearTyping: (roomId, userId) => set((state) => {
    const roomTyping = { ...(state.typingUsers[roomId] || {}) };
    delete roomTyping[userId];
    return { typingUsers: { ...state.typingUsers, [roomId]: roomTyping } };
  }),

  getTypingUsers: (roomId) => {
    const typing = get().typingUsers[roomId] || {};
    const now = Date.now();
    // Only show users who typed in last 3 seconds
    return Object.entries(typing)
      .filter(([, ts]) => now - ts < 3000)
      .map(([uid]) => uid);
  },

  // ─── Encryption ──────────────────────────
  setEncryptionKey: (roomId, keyData) => set((state) => ({
    encryptionKeys: {
      ...state.encryptionKeys,
      [roomId]: { ...(state.encryptionKeys[roomId] || {}), ...keyData },
    },
  })),

  getEncryptionKey: (roomId) => get().encryptionKeys[roomId],

  // ─── Online users ────────────────────────
  setOnlineUsers: (roomId, users) => set((state) => ({
    onlineUsers: { ...state.onlineUsers, [roomId]: users },
  })),

  addOnlineUser: (roomId, userId) => set((state) => {
    const current = state.onlineUsers[roomId] || [];
    if (current.includes(userId)) return {};
    return { onlineUsers: { ...state.onlineUsers, [roomId]: [...current, userId] } };
  }),

  removeOnlineUser: (roomId, userId) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [roomId]: (state.onlineUsers[roomId] || []).filter(u => u !== userId),
    },
  })),

  // ─── WS status ───────────────────────────
  setWsStatus: (status) => set({ wsStatus: status }),

  // ─── Getters ─────────────────────────────
  getCurrentRoom: () => {
    const { rooms, currentRoomId } = get();
    return rooms.find(r => r.id === currentRoomId) || null;
  },

  reset: () => set({
    rooms: [],
    currentRoomId: null,
    messages: {},
    typingUsers: {},
    encryptionKeys: {},
    onlineUsers: {},
    wsStatus: 'disconnected',
  }),
}));
