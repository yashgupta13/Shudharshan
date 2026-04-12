import { useState, useEffect } from 'react';
import { getStreamChatClient, initStreamVideoClient, disconnectStreamClients } from '../services/stream';
import { streamApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export function useStream() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [chatClient, setChatClient] = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    let unmounted = false;

    const connectToStream = async () => {
      if (!user?.id) return;

      try {
        // Fetch Stream token for this user from our backend
        const response = await streamApi.getToken(user.id);
        const { token, user_id: correctId } = response;
        
        if (unmounted) return;

        const chat = getStreamChatClient();
        if (!chat) {
            throw new Error("Stream Chat Client could not be initialized");
        }

        // Only connect if not already connected as this user
        if (chat.userID !== correctId) {
          await chat.disconnectUser(); // Disconnect previous if any
          await chat.connectUser(
            {
              id: correctId,
              name: user.username,
            },
            token
          );
        }

        const video = initStreamVideoClient({ ...user, id: correctId }, token);

        if (unmounted) {
            // Disconnect if unmounted while connecting
            disconnectStreamClients();
            return;
        }

        setChatClient(chat);
        setVideoClient(video);
        setIsClientReady(true);
        
      } catch (err) {
        console.error('Error connecting to Stream', err);
        if (!unmounted) {
          setError(err.message || 'Failed to connect to Stream');
        }
      }
    };

    connectToStream();

    return () => {
      unmounted = true;
      // In development React double mounts, so disconnecting here might 
      // cause immediate disconnection on mount. 
      // Usually disconnect is handled on logout or app unmount at top level.
    };
  }, [user]);

  return { isClientReady, chatClient, videoClient, error };
}
