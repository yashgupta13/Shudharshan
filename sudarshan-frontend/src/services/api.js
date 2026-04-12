const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sudarshan_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(err.detail || err.message || 'Request failed', res.status);
  }

  return res.json();
}

// ─── Auth ───────────────────────────────────
export const authApi = {
  signup: (data) => request('/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/me'),
};

// ─── Rooms ──────────────────────────────────
export const roomsApi = {
  list: () => request('/rooms'),
  create: (data) => request('/create-room', { method: 'POST', body: JSON.stringify(data) }),
  join: (data) => request('/join-room', { method: 'POST', body: JSON.stringify(data) }),
  leave: (roomId) => request(`/rooms/${roomId}/leave`, { method: 'POST' }),
  info: (roomId) => request(`/rooms/${roomId}`),
  members: (roomId) => request(`/rooms/${roomId}/members`),
};

export { ApiError };
