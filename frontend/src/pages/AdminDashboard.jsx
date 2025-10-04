import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, ArrowLeft, Users, Trophy, FileDown, TrendingUp, 
  CheckCircle, XCircle, Trash2, Activity, BarChart3, 
  Clock, UserCheck, RefreshCw, AlertCircle, Eye, Calendar, Star 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [growthData, setGrowthData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, growthRes, retentionRes, hackathonsRes] = await Promise.all([
        adminAPI.getStatsOverview(selectedPeriod === 0 ? 0 : selectedPeriod),
        adminAPI.getGrowthStats(selectedPeriod === 0 ? 365 : selectedPeriod),
        adminAPI.getRetentionStats(),
        adminAPI.getAllHackathons()
      ]);

      setStats(statsRes.data);
      setGrowthData(growthRes.data);
      setRetentionData(retentionRes.data);
      setHackathons(hackathonsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveHackathon = async (hackathonId) => {
    try {
      await adminAPI.approveHackathon(hackathonId);
      toast.success('Hackathon approved successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve hackathon');
    }
  };

  const handleRejectHackathon = async (hackathonId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await adminAPI.rejectHackathon(hackathonId, reason);
      toast.success('Hackathon rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject hackathon');
    }
  };

  const handleDeleteHackathon = async (hackathonId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteHackathon(hackathonId);
      toast.success('Hackathon deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete hackathon');
    }
  };

  const handleToggleFeatured = async (hackathonId, currentFeaturedStatus, title) => {
    const action = currentFeaturedStatus ? 'unfeature' : 'feature';
    if (!window.confirm(`Are you sure you want to ${action} "${title}"?`)) {
      return;
    }

    try {
      await adminAPI.toggleFeatured(hackathonId, !currentFeaturedStatus);
      toast.success(`Hackathon ${action}d successfully`);
      fetchData();
    } catch (error) {
      toast.error(`Failed to ${action} hackathon`);
    }
  };

  const handleExportUsers = async () => {
    try {
      const response = await adminAPI.exportUsers();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users_${Date.now()}.csv`);
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
      link.setAttribute('download', `hackathons_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Hackathons exported successfully');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const pendingHackathons = hackathons.filter(h => h.status === 'pending_approval');
  const publishedHackathons = hackathons.filter(h => h.status === 'published');
  const rejectedHackathons = hackathons.filter(h => h.status === 'rejected');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Enhanced Navbar */}
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">Admin Dashboard</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleExportUsers}
                className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export Users
              </Button>
              <Button
                variant="outline"
                onClick={handleExportHackathons}
                className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export Hackathons
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            Platform <span className="gradient-text">Analytics</span>
          </h1>
          <div className="flex gap-2">
            {[7, 30, 90, 0].map((days) => (
              <Button
                key={days}
                variant={selectedPeriod === days ? 'default' : 'outline'}
                onClick={() => setSelectedPeriod(days)}
                className={selectedPeriod === days ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-gray-700 text-gray-400'}
              >
                {days === 0 ? 'All Time' : `${days} Days`}
              </Button>
            ))}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">Overview</TabsTrigger>
            <TabsTrigger value="hackathons" className="data-[state=active]:bg-purple-600">Hackathons</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Key Metrics */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="glass-effect p-6 hover-lift border border-purple-800/30">
                <div className="flex items-center justify-between mb-4">
                  <Users className="w-10 h-10 text-purple-500" />
                  <RefreshCw className="w-5 h-5 text-gray-600 cursor-pointer hover:text-purple-400" onClick={fetchData} />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">{stats?.total_users || 0}</div>
                <div className="text-sm text-gray-400">Total Users</div>
                <div className="text-xs text-green-400 mt-2">+{stats?.new_users || 0} in period</div>
              </Card>

              <Card className="glass-effect p-6 hover-lift border border-purple-800/30">
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="w-10 h-10 text-yellow-500" />
                  {stats?.pending_hackathons > 0 && (
                    <Badge className="bg-orange-600 text-white animate-pulse">
                      {stats.pending_hackathons} pending
                    </Badge>
                  )}
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">{stats?.total_hackathons || 0}</div>
                <div className="text-sm text-gray-400">Total Hackathons</div>
                <div className="text-xs text-purple-400 mt-2">{stats?.published_hackathons || 0} published</div>
              </Card>

              <Card className="glass-effect p-6 hover-lift border border-purple-800/30">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-10 h-10 text-blue-500" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">{stats?.total_registrations || 0}</div>
                <div className="text-sm text-gray-400">Total Registrations</div>
                <div className="text-xs text-blue-400 mt-2">{stats?.total_submissions || 0} submissions</div>
              </Card>

              <Card className="glass-effect p-6 hover-lift border border-purple-800/30">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-10 h-10 text-green-500" />
                </div>
                <div className="text-3xl font-bold gradient-text mb-1">{retentionData?.retention_rate_30_days || 0}%</div>
                <div className="text-sm text-gray-400">30-Day Retention</div>
                <div className="text-xs text-green-400 mt-2">{retentionData?.active_30_days || 0} active users</div>
              </Card>
            </div>

            {/* Retention Stats */}
            <Card className="glass-effect p-6 border border-purple-800/30">
              <h2 className="text-2xl font-bold mb-6">User <span className="gradient-text">Retention</span></h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-8 h-8 text-green-500" />
                      <div>
                        <div className="text-sm text-gray-400">7-Day Active Users</div>
                        <div className="text-2xl font-bold text-white">{retentionData?.active_7_days || 0}</div>
                      </div>
                    </div>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600">
                      {retentionData?.retention_rate_7_days || 0}%
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-8 h-8 text-blue-500" />
                      <div>
                        <div className="text-sm text-gray-400">30-Day Active Users</div>
                        <div className="text-2xl font-bold text-white">{retentionData?.active_30_days || 0}</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600">
                      {retentionData?.retention_rate_30_days || 0}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-purple-500" />
                      <div>
                        <div className="text-sm text-gray-400">Multi-Hackathon Users</div>
                        <div className="text-2xl font-bold text-white">{retentionData?.multi_hackathon_participants || 0}</div>
                      </div>
                    </div>
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-600">
                      {retentionData?.multi_participation_rate || 0}%
                    </Badge>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-lg border border-purple-600/30">
                    <div className="text-sm text-gray-400 mb-2">Engagement Score</div>
                    <div className="text-3xl font-bold gradient-text">
                      {Math.round((retentionData?.retention_rate_30_days || 0) + (retentionData?.multi_participation_rate || 0)) / 2}%
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Pending Approvals */}
            {pendingHackathons.length > 0 && (
              <Card className="glass-effect p-6 border border-orange-600/50">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-6 h-6 text-orange-500 animate-pulse" />
                  <h2 className="text-2xl font-bold">
                    Pending <span className="text-orange-500">Approvals</span>
                  </h2>
                  <Badge className="bg-orange-600 text-white">{pendingHackathons.length}</Badge>
                </div>
                <div className="space-y-4">
                  {pendingHackathons.slice(0, 3).map((hackathon) => (
                    <div
                      key={hackathon.id}
                      className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{hackathon.title}</h3>
                        <p className="text-sm text-gray-400">by {hackathon.organizer_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(hackathon.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/hackathon/${hackathon.id}`)}
                          variant="outline"
                          className="border-purple-600 text-purple-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproveHackathon(hackathon.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRejectHackathon(hackathon.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Hackathons Tab */}
          <TabsContent value="hackathons" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card className="glass-effect p-4 border border-orange-600/30">
                <div className="text-sm text-gray-400 mb-2">Pending Approval</div>
                <div className="text-3xl font-bold text-orange-500">{pendingHackathons.length}</div>
              </Card>
              <Card className="glass-effect p-4 border border-green-600/30">
                <div className="text-sm text-gray-400 mb-2">Published</div>
                <div className="text-3xl font-bold text-green-500">{publishedHackathons.length}</div>
              </Card>
              <Card className="glass-effect p-4 border border-red-600/30">
                <div className="text-sm text-gray-400 mb-2">Rejected</div>
                <div className="text-3xl font-bold text-red-500">{rejectedHackathons.length}</div>
              </Card>
            </div>

            {/* All Hackathons List */}
            <Card className="glass-effect p-6 border border-purple-800/30">
              <h2 className="text-2xl font-bold mb-6">All <span className="gradient-text">Hackathons</span></h2>
              <div className="space-y-3">
                {hackathons.map((hackathon) => (
                  <div
                    key={hackathon.id}
                    className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-white">{hackathon.title}</h3>
                        <Badge
                          className={
                            hackathon.status === 'pending_approval'
                              ? 'bg-orange-600/20 text-orange-400 border-orange-600'
                              : hackathon.status === 'published'
                              ? 'bg-green-600/20 text-green-400 border-green-600'
                              : hackathon.status === 'rejected'
                              ? 'bg-red-600/20 text-red-400 border-red-600'
                              : 'bg-gray-600/20 text-gray-400 border-gray-600'
                          }
                        >
                          {hackathon.status.replace('_', ' ')}
                        </Badge>
                        {hackathon.featured && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500">
                            <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        by {hackathon.organizer_name} • {hackathon.registration_count || 0} registrations • {hackathon.submission_count || 0} submissions
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Created: {new Date(hackathon.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/hackathon/${hackathon.id}`)}
                        variant="outline"
                        className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(hackathon.status === 'published' || hackathon.status === 'ongoing') && (
                        <Button
                          size="sm"
                          onClick={() => handleToggleFeatured(hackathon.id, hackathon.featured, hackathon.title)}
                          className={hackathon.featured ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"}
                          title={hackathon.featured ? "Remove from featured" : "Mark as featured"}
                        >
                          <Star className={`w-4 h-4 ${hackathon.featured ? 'fill-white' : ''}`} />
                        </Button>
                      )}
                      {hackathon.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApproveHackathon(hackathon.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRejectHackathon(hackathon.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleDeleteHackathon(hackathon.id, hackathon.title)}
                        className="bg-red-900/50 hover:bg-red-900 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Growth Charts */}
            {growthData && growthData.dates && growthData.dates.length > 0 ? (
              <div className="space-y-6">
                {/* Combined Line Chart */}
                <Card className="glass-effect p-6 border border-purple-800/30">
                  <h2 className="text-2xl font-bold mb-6">Platform <span className="gradient-text">Growth Trends</span></h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={growthData.dates.map((date, idx) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        signups: growthData.user_signups[idx],
                        hackathons: growthData.hackathon_creations[idx],
                        registrations: growthData.registrations[idx]
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ color: '#9CA3AF' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="signups" 
                        stroke="#a855f7" 
                        strokeWidth={3}
                        dot={{ fill: '#a855f7', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="User Signups"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hackathons" 
                        stroke="#ec4899" 
                        strokeWidth={3}
                        dot={{ fill: '#ec4899', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Hackathons Created"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="registrations" 
                        stroke="#14b8a6" 
                        strokeWidth={3}
                        dot={{ fill: '#14b8a6', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Registrations"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Area Chart for User Growth */}
                <Card className="glass-effect p-6 border border-teal-500/30">
                  <h2 className="text-2xl font-bold mb-6">User <span className="gradient-text">Signup Trend</span></h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={growthData.dates.map((date, idx) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        signups: growthData.user_signups[idx]
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="signups" 
                        stroke="#14b8a6" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorSignups)"
                        name="User Signups"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                {/* Bar Chart Comparison */}
                <Card className="glass-effect p-6 border border-purple-800/30">
                  <h2 className="text-2xl font-bold mb-6">Activity <span className="gradient-text">Comparison</span></h2>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={growthData.dates.slice(-14).map((date, idx) => ({
                        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        signups: growthData.user_signups.slice(-14)[idx],
                        hackathons: growthData.hackathon_creations.slice(-14)[idx],
                        registrations: growthData.registrations.slice(-14)[idx]
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <YAxis 
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ color: '#9CA3AF' }}
                      />
                      <Bar dataKey="signups" fill="#a855f7" name="User Signups" />
                      <Bar dataKey="hackathons" fill="#ec4899" name="Hackathons" />
                      <Bar dataKey="registrations" fill="#14b8a6" name="Registrations" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                {/* Summary Stats */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="glass-effect p-6 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <Users className="w-10 h-10 text-purple-400" />
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-1">
                      {growthData.user_signups.reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Total User Signups</div>
                    <div className="text-xs text-green-400 mt-2">
                      +{growthData.user_signups.slice(-7).reduce((a, b) => a + b, 0)} in last 7 days
                    </div>
                  </Card>

                  <Card className="glass-effect p-6 border border-pink-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <Trophy className="w-10 h-10 text-pink-400" />
                      <Activity className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-pink-400 mb-1">
                      {growthData.hackathon_creations.reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Hackathons Created</div>
                    <div className="text-xs text-green-400 mt-2">
                      +{growthData.hackathon_creations.slice(-7).reduce((a, b) => a + b, 0)} in last 7 days
                    </div>
                  </Card>

                  <Card className="glass-effect p-6 border border-teal-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <UserCheck className="w-10 h-10 text-teal-400" />
                      <BarChart3 className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="text-3xl font-bold text-teal-400 mb-1">
                      {growthData.registrations.reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-400">Total Registrations</div>
                    <div className="text-xs text-green-400 mt-2">
                      +{growthData.registrations.slice(-7).reduce((a, b) => a + b, 0)} in last 7 days
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="glass-effect p-6 border border-purple-800/30">
                <div className="text-center py-8 text-gray-400">
                  No growth data available for the selected period
                </div>
              </Card>
            )}

            {/* User Distribution */}
            <Card className="glass-effect p-6 border border-purple-800/30">
              <h2 className="text-2xl font-bold mb-6">User <span className="gradient-text">Distribution</span></h2>
              <div className="grid md:grid-cols-2 gap-6">
                {stats?.role_distribution && Object.entries(stats.role_distribution).map(([role, count]) => (
                  <div key={role} className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400 capitalize">{role}</span>
                      <span className="text-2xl font-bold gradient-text">{count}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                        style={{ width: `${(count / stats.total_users) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}