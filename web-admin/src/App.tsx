import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LiveEvents from './pages/LiveEvents';
import MediaLibrary from './pages/MediaLibrary';
import Community from './pages/Community';
import Sidebar from './components/Sidebar';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkAdminStatus(session.user.id);
      else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setIsAdmin(data.role === 'admin');
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--background)' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid var(--primary-light)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session && isAdmin ? <Navigate to="/" /> : <Login />} />

        <Route path="/*" element={
          session && isAdmin ? (
            <div style={{ display: 'flex', minHeight: '100vh' }}>
              <Sidebar />
              <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/live" element={<LiveEvents />} />
                  <Route path="/media" element={<MediaLibrary />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/notifications" element={<div>Notifications (Coming Soon)</div>} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
