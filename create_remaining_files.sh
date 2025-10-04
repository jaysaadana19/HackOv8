#!/bin/bash

# Create Profile page
cat > /app/frontend/src/pages/Profile.jsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Save, Github, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { authAPI, userAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data;
      setName(user.name || '');
      setBio(user.bio || '');
      setGithubLink(user.github_link || '');
      setLinkedinLink(user.linkedin_link || '');
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile({ name, bio, github_link: githubLink, linkedin_link: linkedinLink });
      toast.success('Profile updated successfully!');
      
      // Update local storage
      const user = getUser();
      localStorage.setItem('user', JSON.stringify({ ...user, name, bio, github_link: githubLink, linkedin_link: linkedinLink }));
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Rocket className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-bold gradient-text">Hackov8</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Edit <span className="gradient-text">Profile</span></h1>

        <Card className="glass-effect p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white min-h-24"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                <Github className="w-4 h-4 inline mr-2" />
                GitHub Profile
              </label>
              <Input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                <Linkedin className="w-4 h-4 inline mr-2" />
                LinkedIn Profile
              </label>
              <Input
                type="url"
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
EOF

# Create simplified Organizer, Judge, and Admin dashboards
cat > /app/frontend/src/pages/OrganizerDashboard.jsx << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold gradient-text">Organizer Dashboard</span>
        </div>
      </nav>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-4">Organizer <span className="gradient-text">Dashboard</span></h1>
        <p className="text-gray-400 mb-8">Create and manage your hackathons</p>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-5 h-5 mr-2" />
          Create Hackathon
        </Button>
      </div>
    </div>
  );
}
EOF

cat > /app/frontend/src/pages/JudgeDashboard.jsx << 'EOF'
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JudgeDashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold gradient-text">Judge Dashboard</span>
        </div>
      </nav>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-4">Judge <span className="gradient-text">Dashboard</span></h1>
        <p className="text-gray-400">Review and score submissions</p>
      </div>
    </div>
  );
}
EOF

cat > /app/frontend/src/pages/AdminDashboard.jsx << 'EOF'
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Users, Trophy, FileDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await adminAPI.exportUsers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'users.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Users exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleExportHackathons = async () => {
    try {
      const response = await adminAPI.exportHackathons();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'hackathons.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Hackathons exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold gradient-text">Admin Dashboard</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin <span className="gradient-text">Dashboard</span></h1>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect p-6">
            <Users className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold gradient-text">{stats?.total_users || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Total Users</div>
          </Card>
          <Card className="glass-effect p-6">
            <Trophy className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold gradient-text">{stats?.total_hackathons || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Hackathons</div>
          </Card>
          <Card className="glass-effect p-6">
            <TrendingUp className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold gradient-text">{stats?.total_registrations || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Registrations</div>
          </Card>
          <Card className="glass-effect p-6">
            <FileDown className="w-8 h-8 text-purple-500 mb-3" />
            <div className="text-3xl font-bold gradient-text">{stats?.total_submissions || 0}</div>
            <div className="text-sm text-gray-400 mt-1">Submissions</div>
          </Card>
        </div>

        {/* Export Actions */}
        <Card className="glass-effect p-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Data Export</h2>
          <div className="flex gap-4">
            <Button
              onClick={handleExportUsers}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Export Users
            </Button>
            <Button
              onClick={handleExportHackathons}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <FileDown className="w-5 h-5 mr-2" />
              Export Hackathons
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
EOF

echo "Pages created successfully"
