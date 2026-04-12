import { StreamChat } from 'stream-chat';
import { StreamVideoClient } from '@stream-io/video-react-sdk';

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

let chatClientInstance = null;
let videoClientInstance = null;

export const getStreamChatClient = () => {
  if (!apiKey) {
    console.error('Missing VITE_STREAM_API_KEY in environment variables.');
    return null;
  }
  if (!chatClientInstance) {
    chatClientInstance = StreamChat.getInstance(apiKey);
  }
  return chatClientInstance;
};

export const initStreamVideoClient = (user, token) => {
  if (!apiKey) {
    console.error('Missing VITE_STREAM_API_KEY in environment variables.');
    return null;
  }

  // Stream Video requires a full user object with id
  const videoUser = {
    id: user.id || user.username, // Fallback to username if id is not available easily
    name: user.username,
  };

  if (videoClientInstance) {
    // Already initialized or different user, we might need to disconnect previous
    return videoClientInstance;
  }

  videoClientInstance = new StreamVideoClient({
    apiKey,
    user: videoUser,
    token,
  });

  return videoClientInstance;
};

export const disconnectStreamClients = async () => {
  if (chatClientInstance) {
    await chatClientInstance.disconnectUser();
    chatClientInstance = null;
  }
  if (videoClientInstance) {
    await videoClientInstance.disconnectUser();
    videoClientInstance = null;
  }
};
