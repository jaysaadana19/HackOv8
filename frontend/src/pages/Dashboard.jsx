import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Trophy, Users, Code, Calendar, MapPin, Plus, LogOut, User, Bell, Settings } from 'lucide-react';
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
      {/* Navbar */}
      <nav className="border-b border-gray-900 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50" data-testid="dashboard-navbar">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Rocket className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-bold gradient-text">Hackov8</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="ghost"
                className="relative text-gray-400 hover:text-white"
                onClick={() => setShowNotifications(!showNotifications)}
                data-testid="notifications-btn"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 glass-effect rounded-xl p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold mb-3 text-white">Notifications</h3>
                  {notifications.length === 0 ? (
                    <p className="text-gray-500 text-sm">No notifications</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-gray-900/30' : 'bg-purple-900/20'}`}>
                          <p className="text-sm font-semibold text-white">{notif.title}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {(user?.role === 'admin' || user?.role === 'organizer' || user?.role === 'judge') && (
              <Button
                onClick={navigateByRole}
                className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-600/50"
                data-testid="role-dashboard-btn"
              >
                {user.role === 'admin' ? 'Admin Panel' : user.role === 'organizer' ? 'Organizer Panel' : 'Judge Panel'}
              </Button>
            )}

            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={() => navigate('/profile')}
              data-testid="profile-btn"
            >
              <User className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, <span className="gradient-text">{user?.name}</span>!</h1>
          <p className="text-gray-400">Your hackathon journey continues here</p>
        </div>

        {/* My Registrations */}
        {myRegistrations.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">My Registrations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myRegistrations.map((reg) => {
                const hackathon = hackathons.find(h => h.id === reg.hackathon_id);
                if (!hackathon) return null;

                return (
                  <Card
                    key={reg.id}
                    className="glass-effect hover-lift cursor-pointer"
                    onClick={() => navigate(`/hackathon/${hackathon.id}`)}
                    data-testid={`registration-card-${reg.id}`}
                  >
                    <div className="h-32 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                      {hackathon.cover_image ? (
                        <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover" />
                      ) : (
                        <Code className="w-12 h-12 text-purple-500" />
                      )}
                    </div>
                    <div className="p-6">
                      <Badge className="status-badge status-live mb-3">Registered</Badge>
                      <h3 className="text-lg font-bold text-white mb-2">{hackathon.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
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
            <h2 className="text-2xl font-bold mb-6">My Teams</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTeams.map((team) => (
                <Card key={team.id} className="glass-effect p-6" data-testid={`team-card-${team.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{team.name}</h3>
                      <Badge className="status-badge status-upcoming">
                        {team.leader_id === user.id ? 'Team Leader' : 'Member'}
                      </Badge>
                    </div>
                    <Users className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{team.members.length} members</span>
                    </div>
                    {team.leader_id === user.id && (
                      <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Invite Code</p>
                        <code className="text-purple-400 font-mono text-sm">{team.invite_code}</code>
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
          <h2 className="text-2xl font-bold mb-6">Available Hackathons</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => {
              const isRegistered = myRegistrations.some(r => r.hackathon_id === hackathon.id);

              return (
                <Card
                  key={hackathon.id}
                  className="glass-effect hover-lift overflow-hidden"
                  data-testid={`available-hackathon-${hackathon.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center">
                    {hackathon.cover_image ? (
                      <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover" />
                    ) : (
                      <Code className="w-16 h-16 text-purple-500" />
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">{hackathon.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2">{hackathon.description}</p>
                    </div>

                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="capitalize">{hackathon.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(hackathon.event_start).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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
                          Register
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
