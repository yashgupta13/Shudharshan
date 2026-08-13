import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sha256, encryptWithPasskey, decryptWithPasskey } from '../utils/encryption';

/**
 * Encryption Store - manages room encryption keys
 * Keys are stored per room and used for E2E encryption of messages
 */
export const useEncryptionStore = create(
  persist(
    (set, get) => ({
      // Room encryption keys (roomId -> aesKeyHex)
      roomKeys: {},

      // Room passkey hashes (for fallback encryption)
      roomPasskeys: {},

      /**
       * Store encryption key for a room (derived from DH exchange or passkey)
       */
      setRoomKey: (roomId, aesKeyHex) => {
        set((state) => ({
          roomKeys: {
            ...state.roomKeys,
            [roomId]: aesKeyHex,
          },
        }));
      },

      /**
       * Store passkey hash for a room (used as fallback encryption key)
       */
      setRoomPasskey: (roomId, passkeyHash) => {
        set((state) => ({
          roomPasskeys: {
            ...state.roomPasskeys,
            [roomId]: passkeyHash,
          },
        }));
      },

      /**
       * Get encryption key for a room
       */
      getRoomKey: (roomId) => {
        const { roomKeys, roomPasskeys } = get();
        // Prefer DH-derived key, fallback to passkey hash
        return roomKeys[roomId] || roomPasskeys[roomId];
      },

      /**
       * Check if room has encryption key
       */
      hasRoomKey: (roomId) => {
        const { roomKeys, roomPasskeys } = get();
        return !!(roomKeys[roomId] || roomPasskeys[roomId]);
      },

      /**
       * Remove encryption key for a room
       */
      removeRoomKey: (roomId) => {
        set((state) => {
          const newKeys = { ...state.roomKeys };
          const newPasskeys = { ...state.roomPasskeys };
          delete newKeys[roomId];
          delete newPasskeys[roomId];
          return {
            roomKeys: newKeys,
            roomPasskeys: newPasskeys,
          };
        });
      },

      /**
       * Clear all encryption keys
       */
      clearAll: () => {
        set({
          roomKeys: {},
          roomPasskeys: {},
        });
      },

      /**
       * Setup encryption for a room using passkey
       */
      setupRoomEncryption: async (roomId, passkey) => {
        try {
          const passkeyHash = await sha256(passkey);
          get().setRoomPasskey(roomId, passkeyHash);
          return passkeyHash;
        } catch (error) {
          console.error('Failed to setup room encryption:', error);
          throw error;
        }
      },
    }),
    {
      name: 'encryption-storage',
      // Only persist passkey hashes, not DH-derived keys (those are session-only)
      partialize: (state) => ({
        roomPasskeys: state.roomPasskeys,
      }),
    }
  )
);
