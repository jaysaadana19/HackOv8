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
import Settings from '@/pages/Settings';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import GoogleCallback from '@/pages/GoogleCallback';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingEnhanced />} />
          <Route path="/auth/google/callback" element={<GoogleCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hackathon/:slug" element={<HackathonDetailEnhanced />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/judge" element={<JudgeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );
}

export default App;
