import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatContext, Channel, Window, MessageList, MessageInput, ChannelHeader } from 'stream-chat-react';
import { useStreamVideoClient, StreamCall, SpeakerLayout, CallControls } from '@stream-io/video-react-sdk';
import Sidebar from '../components/Sidebar';
import { Menu, X, Video, PhoneOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { client: chatClient } = useChatContext();
  const videoClient = useStreamVideoClient();

  const [channel, setChannel] = useState(null);
  const [call, setCall] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatClient || !user || !roomId) return;

    const setupStream = async () => {
      try {
        const newChannel = chatClient.channel('messaging', roomId, {
          name: `Room ${roomId}`,
          members: [user.id || user.username],
        });
        await newChannel.watch();
        setChannel(newChannel);
      } catch (err) {
         console.error('Failed to join channel', err);
         toast.error('Failed to join room securely');
         navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    setupStream();

    return () => {
        // cleanup optionally handled by context at a higher level
    };
  }, [chatClient, roomId, user, navigate]);

  const joinCall = async () => {
     if (!videoClient) return;
     try {
       const newCall = videoClient.call('default', roomId);
       await newCall.join({ create: true });
       setCall(newCall);
     } catch (err) {
       toast.error('Failed to start call');
     }
  };

  const leaveCall = async () => {
    if (call) {
      await call.leave();
      setCall(null);
    }
  };

  if (loading || !channel) {
    return (
      <div className="h-screen bg-void grid-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border border-accent/40 border-t-accent animate-spin mx-auto mb-4" />
          <p className="text-muted text-xs tracking-widest">CONNECTING TO SECURE STREAM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-void flex overflow-hidden">
      {/* Sidebar - desktop always visible, mobile overlay */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:flex md:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar currentRoomId={roomId} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-void/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-panel">
        <div className="md:hidden absolute top-3 left-3 z-50">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="w-9 h-9 border border-border-bright bg-panel flex items-center justify-center text-muted hover:text-accent transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {call ? (
          <div className="flex-1 flex flex-col bg-panel z-40 p-4">
             <div className="flex justify-between items-center mb-4 pt-10 md:pt-0">
                <h2 className="text-accent font-bold">Secure Video Call</h2>
                <button onClick={leaveCall} className="bg-danger text-white px-3 py-1 flex items-center gap-2">
                   <PhoneOff className="w-4 h-4"/> Leave
                </button>
             </div>
             <div className="flex-1 bg-void border border-border overflow-hidden rounded">
                <StreamCall call={call}>
                    <SpeakerLayout />
                    <CallControls onLeave={leaveCall} />
                </StreamCall>
             </div>
          </div>
        ) : (
          <Channel channel={channel}>
            <Window>
              <div className="flex justify-between items-center border-b border-border p-2 bg-[#050508] pl-16 md:pl-2">
                 <div className="text-muted text-sm font-mono">
                     Connected to <span className="text-accent">{channel.data?.name}</span>
                 </div>
                 <button onClick={joinCall} className="flex items-center gap-2 text-accent px-3 py-1 border border-accent hover:bg-accent/10 transition-colors bg-void">
                    <Video className="w-4 h-4"/> Start Encrypted Call
                 </button>
              </div>
              {/* <ChannelHeader /> */}
              <MessageList />
              <MessageInput />
            </Window>
          </Channel>
        )}
      </div>
    </div>
  );
}
