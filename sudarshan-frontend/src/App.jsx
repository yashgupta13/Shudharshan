import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoadingScreen from './components/LoadingScreen';
import { useStream } from './hooks/useStream';
import { Chat } from 'stream-chat-react';
import { StreamVideo } from '@stream-io/video-react-sdk';

import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-react-sdk/dist/css/styles.css';


const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatRoomPage = lazy(() => import('./pages/ChatRoomPage'));

function ProtectedRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return !token ? children : <Navigate to="/dashboard" replace />;
}

function StreamAppWrapper({ children }) {
  const { isClientReady, chatClient, videoClient, error } = useStream();

  if (error) {
    return <div className="p-4 text-danger">Stream Connection Error: {error}</div>;
  }

  if (!isClientReady) {
    return <LoadingScreen/>;
  }

  // Provider Wrap
  return (
    <StreamVideo client={videoClient}>
      <Chat client={chatClient} theme="str-chat__theme-dark">
        {children}
      </Chat>
    </StreamVideo>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="scanline" />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f0f1a',
            color: '#e0e0f0',
            border: '1px solid #252540',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '12px',
            borderRadius: '0',
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#050508' } },
          error: { iconTheme: { primary: '#ff3366', secondary: '#050508' } },
        }}
      />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><StreamAppWrapper><DashboardPage /></StreamAppWrapper></ProtectedRoute>} />
          <Route path="/room/:roomId" element={<ProtectedRoute><StreamAppWrapper><ChatRoomPage /></StreamAppWrapper></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
