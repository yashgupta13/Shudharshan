import { create } from 'zustand';
import { authApi } from '../services/api';

const TOKEN_KEY = 'sudarshan_token';
const USER_KEY = 'sudarshan_user';

export const useAuthStore = create((set, get) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  })(),
  token: localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  error: null,

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login({ username, password });
      const user = { username, id: data.user_id || username };
      
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      set({ user, token: data.access_token, isLoading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  signup: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.signup({ username, password });
      // Auto-login after signup
      return get().login(username, password);
    } catch (err) {
      set({ error: err.message, isLoading: false });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),

  isAuthenticated: () => !!get().token,
}));
