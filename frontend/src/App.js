import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import LandingEnhanced from '@/pages/LandingEnhanced';
import Dashboard from '@/pages/Dashboard';
import HackathonDetailEnhanced from '@/pages/HackathonDetailEnhanced';
import OrganizerDashboard from '@/pages/OrganizerDashboard';
import JudgeDashboard from '@/pages/JudgeDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import Profile from '@/pages/Profile';
import About from '@/pages/About';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingEnhanced />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hackathon/:id" element={<HackathonDetail />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/judge" element={<JudgeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );
}

export default App;
