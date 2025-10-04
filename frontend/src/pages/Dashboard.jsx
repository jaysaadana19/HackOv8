import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Trophy, Users, Code, Calendar, MapPin, Plus, LogOut, User, Bell, Settings, TrendingUp, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, authAPI, registrationAPI, teamAPI, notificationAPI } from '@/lib/api';
import { isAuthenticated, getUser, clearAuth } from '@/lib/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [hackathons, setHackathons] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, hackathonsRes, regsRes, teamsRes, notifsRes] = await Promise.all([
        authAPI.getCurrentUser(),
        hackathonAPI.getAll({ status: 'published' }),
        registrationAPI.getMyRegistrations(),
        teamAPI.getMy(),
        notificationAPI.getAll(),
      ]);

      setUser(userRes.data);
      setHackathons(hackathonsRes.data);
      setMyRegistrations(regsRes.data);
      setMyTeams(teamsRes.data);
      setNotifications(notifsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      clearAuth();
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleRegister = async (hackathonId) => {
    try {
      await registrationAPI.register(hackathonId);
      toast.success('Registered successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const navigateByRole = () => {
    if (user?.role === 'admin') {
      navigate('/admin');
    } else if (user?.role === 'organizer') {
      navigate('/organizer');
    } else if (user?.role === 'judge') {
      navigate('/judge');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50" data-testid="dashboard-navbar">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg glow-purple">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Hackov8</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="relative text-gray-400 hover:text-white hover:bg-purple-900/20"
                  onClick={() => setShowNotifications(!showNotifications)}
                  data-testid="notifications-btn"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 glass-effect rounded-xl p-4 max-h-96 overflow-y-auto shadow-2xl border border-purple-800/30 animate-fadeIn">
                    <h3 className="font-semibold mb-3 text-white">Notifications</h3>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">No notifications</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif) => (
                          <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-gray-900/30' : 'bg-purple-900/20 border border-purple-800/30'}`}>
                            <p className="text-sm font-semibold text-white">{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Role Dashboard Button */}
              {(user?.role === 'admin' || user?.role === 'organizer' || user?.role === 'judge') && (
                <Button
                  onClick={navigateByRole}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg"
                  data-testid="role-dashboard-btn"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {user.role === 'admin' ? 'Admin Panel' : user.role === 'organizer' ? 'Organizer Panel' : 'Judge Panel'}
                </Button>
              )}

              {/* Profile Button */}
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-purple-900/20"
                onClick={() => navigate('/profile')}
                data-testid="profile-btn"
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Logout Button */}
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                onClick={handleLogout}
                data-testid="logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Welcome Section */}
        <div className="relative mb-12 overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
          <div className="relative glass-effect p-10 border border-purple-800/30">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-2xl">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, <span className="gradient-text">{user?.name}</span>! 👋
                </h1>
                <p className="text-gray-400 text-lg">Ready to build something amazing?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Trophy, label: 'Registered', value: myRegistrations.length, gradient: 'from-yellow-500 to-orange-500' },
            { icon: Users, label: 'Teams', value: myTeams.length, gradient: 'from-purple-500 to-pink-500' },
            { icon: Code, label: 'Available', value: hackathons.length, gradient: 'from-blue-500 to-cyan-500' },
            { icon: Star, label: 'Notifications', value: unreadCount, gradient: 'from-green-500 to-emerald-500' },
          ].map((stat, idx) => (
            <Card key={idx} className="glass-effect hover-lift p-6 border border-gray-800">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* My Registrations */}
        {myRegistrations.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">My <span className="gradient-text">Registrations</span></h2>
              <Badge className="status-badge status-live px-4 py-2">Active</Badge>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRegistrations.map((reg) => {
                const hackathon = hackathons.find(h => h.id === reg.hackathon_id);
                if (!hackathon) return null;

                return (
                  <Card
                    key={reg.id}
                    className="glass-effect hover-lift cursor-pointer overflow-hidden border border-purple-800/30 group"
                    onClick={() => navigate(`/hackathon/${hackathon.id}`)}
                    data-testid={`registration-card-${reg.id}`}
                  >
                    <div className="h-40 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                      {hackathon.cover_image ? (
                        <>
                          <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </>
                      ) : (
                        <Code className="w-16 h-16 text-purple-400 group-hover:scale-110 transition-transform" />
                      )}
                      <Badge className="absolute top-3 right-3 status-badge status-live">Registered</Badge>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors">{hackathon.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>{new Date(hackathon.event_start).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* My Teams */}
        {myTeams.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">My <span className="gradient-text">Teams</span></h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map((team) => (
                <Card key={team.id} className="glass-effect hover-lift p-6 border border-purple-800/30" data-testid={`team-card-${team.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{team.name}</h3>
                      <Badge className={`status-badge ${team.leader_id === user.id ? 'status-live' : 'status-upcoming'}`}>
                        {team.leader_id === user.id ? '👑 Team Leader' : 'Member'}
                      </Badge>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">{team.members.length} members</span>
                    </div>
                    {team.leader_id === user.id && (
                      <div className="mt-4 p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                        <p className="text-xs text-gray-400 mb-1">Invite Code</p>
                        <code className="text-purple-400 font-mono text-sm font-bold">{team.invite_code}</code>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Available Hackathons */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold">Available <span className="gradient-text">Hackathons</span></h2>
            <Button
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
              onClick={() => navigate('/')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Browse All
            </Button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.slice(0, 6).map((hackathon) => {
              const isRegistered = myRegistrations.some(r => r.hackathon_id === hackathon.id);

              return (
                <Card
                  key={hackathon.id}
                  className="glass-effect hover-lift overflow-hidden border border-gray-800 group"
                  data-testid={`available-hackathon-${hackathon.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                    {hackathon.cover_image ? (
                      <>
                        <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      </>
                    ) : (
                      <Code className="w-20 h-20 text-purple-400 group-hover:rotate-12 transition-transform" />
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{hackathon.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{hackathon.description}</p>

                    <div className="space-y-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span className="capitalize">{hackathon.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>{new Date(hackathon.event_start).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-800">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        onClick={() => navigate(`/hackathon/${hackathon.id}`)}
                        data-testid={`view-details-btn-${hackathon.id}`}
                      >
                        View Details
                      </Button>
                      {!isRegistered && (
                        <Button
                          variant="outline"
                          className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegister(hackathon.id);
                          }}
                          data-testid={`register-btn-${hackathon.id}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
