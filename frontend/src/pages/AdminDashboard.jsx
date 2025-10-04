import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, ArrowLeft, Users, Trophy, FileDown, TrendingUp, 
  CheckCircle, XCircle, Trash2, Activity, BarChart3, 
  Clock, UserCheck, RefreshCw, AlertCircle, Eye, Calendar 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { adminAPI } from '@/lib/api';

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
            {/* Growth Chart */}
            <Card className="glass-effect p-6 border border-purple-800/30">
              <h2 className="text-2xl font-bold mb-6">Platform <span className="gradient-text">Growth</span></h2>
              
              {growthData && growthData.dates && growthData.dates.length > 0 ? (
                <div className="space-y-6">
                  {/* Simple Bar Chart Visualization */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">User Signups</div>
                      <div className="flex items-end gap-1 h-32">
                        {growthData.user_signups.slice(-30).map((value, idx) => {
                          const maxValue = Math.max(...growthData.user_signups);
                          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="flex-1 bg-gradient-to-t from-purple-600 to-purple-400 rounded-t hover:opacity-80 transition-opacity"
                              style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                              title={`${value} signups on ${growthData.dates[idx]}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-2">Hackathon Creations</div>
                      <div className="flex items-end gap-1 h-32">
                        {growthData.hackathon_creations.slice(-30).map((value, idx) => {
                          const maxValue = Math.max(...growthData.hackathon_creations);
                          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="flex-1 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t hover:opacity-80 transition-opacity"
                              style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                              title={`${value} hackathons on ${growthData.dates[idx]}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400 mb-2">Registrations</div>
                      <div className="flex items-end gap-1 h-32">
                        {growthData.registrations.slice(-30).map((value, idx) => {
                          const maxValue = Math.max(...growthData.registrations);
                          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:opacity-80 transition-opacity"
                              style={{ height: `${height}%`, minHeight: value > 0 ? '4px' : '0' }}
                              title={`${value} registrations on ${growthData.dates[idx]}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {growthData.user_signups.reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="text-sm text-gray-400">Total Signups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-400">
                        {growthData.hackathon_creations.reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="text-sm text-gray-400">Hackathons Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {growthData.registrations.reduce((a, b) => a + b, 0)}
                      </div>
                      <div className="text-sm text-gray-400">Total Registrations</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No growth data available for the selected period
                </div>
              )}
            </Card>

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