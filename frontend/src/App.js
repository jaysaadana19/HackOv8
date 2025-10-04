import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import HackathonDetail from '@/pages/HackathonDetail';
import OrganizerDashboard from '@/pages/OrganizerDashboard';
import JudgeDashboard from '@/pages/JudgeDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import Profile from '@/pages/Profile';
import '@/App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/hackathon/:id" element={<HackathonDetail />} />
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/judge" element={<JudgeDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );
}

export default App;
