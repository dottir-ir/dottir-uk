import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PostsProvider } from './contexts/PostsContext';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

// Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import Home from './pages/Home';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import { SecuritySettings } from './pages/settings/SecuritySettings';
import { Newsfeed } from './components/newsfeed/Newsfeed';

// Components
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <PostsProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Protected routes */}
            <Route element={<Layout />}>
              <Route path="/" element={
                <ProtectedRoute>
                  <Newsfeed />
                </ProtectedRoute>
              } />
              
              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/create-post" element={
                <ProtectedRoute requireVerification>
                  <CreatePost />
                </ProtectedRoute>
              } />
              
              <Route path="/post/:postId" element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              } />
            </Route>

            {/* Settings routes */}
            <Route path="/settings/security" element={<SecuritySettings />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PostsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;