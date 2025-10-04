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
