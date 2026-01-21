
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Videos from './pages/Videos';
import Podcasts from './pages/Podcasts';
import Community from './pages/Community';
import Live from './pages/Live';
import Hub from './pages/Hub';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="videos" element={<Videos />} />
          <Route path="podcasts" element={<Podcasts />} />
          <Route path="community" element={<Community />} />
          <Route path="live" element={<Live />} />
          <Route path="hub" element={<Hub />} />
          <Route path="auth" element={<Auth />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<div style={{ padding: '2rem' }}>404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
