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
import PublicProfile from '@/pages/PublicProfile';
import About from '@/pages/About';
import Settings from '@/pages/Settings';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
// Google OAuth removed
// Certificate pages removed
import VerifyEmail from '@/pages/VerifyEmail';
import VerificationRequired from '@/pages/VerificationRequired';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingEnhanced />} />
        {/* Google OAuth callback removed */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hackathon/:slug" element={<HackathonDetailEnhanced />} />
        {/* Certificate routes removed */}
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verification-required" element={<VerificationRequired />} />
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/judge" element={<JudgeDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:slug" element={<PublicProfile />} />
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
