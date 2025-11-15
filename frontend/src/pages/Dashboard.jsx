import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Trophy, Users, Code, Calendar, MapPin, Plus, LogOut, User, Bell, Settings, TrendingUp, Star, Zap, Sun, Moon, Share2, Menu, X, Award, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, registrationAPI, teamAPI, authAPI, notificationAPI, referralAPI } from '@/lib/api';
import ReferralModal from '@/components/ReferralModal';
import { isAuthenticated, getUser, clearAuth } from '@/lib/auth';
import { getHackathonBanner } from '@/lib/bannerImages';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [hackathons, setHackathons] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedHackathonForReferral, setSelectedHackathonForReferral] = useState(null);
  const [myReferralStats, setMyReferralStats] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [myCertificates, setMyCertificates] = useState([]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
      const [userRes, hackathonsRes, regsRes, teamsRes, notifsRes, referralRes] = await Promise.all([
        authAPI.getCurrentUser(),
        hackathonAPI.getAll({ status: 'published' }),
        registrationAPI.getMyRegistrations(),
        teamAPI.getMy(),
        notificationAPI.getAll(),
        referralAPI.getMyStats(),
      ]);

      setUser(userRes.data);
      setHackathons(hackathonsRes.data);
      setMyRegistrations(regsRes.data);
      setMyTeams(teamsRes.data);
      setNotifications(notifsRes.data);
      setMyReferralStats(referralRes.data);
      
      // Fetch certificates (non-blocking)
      try {
        if (userRes.data && userRes.data.email) {
          await fetchMyCertificates(userRes.data.email);
        }
      } catch (certError) {
        console.log('Could not fetch certificates:', certError);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCertificates = async (userEmail) => {
    if (!userEmail) return;
    
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await fetch(`${API_URL}/certificates/my?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setMyCertificates(data.certificates || []);
      }
    } catch (error) {
      console.log('Failed to fetch certificates');
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

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      toast.success('All notifications marked as read');
      fetchData();
    } catch (error) {
      toast.error('Failed to mark notifications as read');
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
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-2xl font-bold gradient-text">Hackov8</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className="relative text-gray-400 hover:text-white hover:bg-teal-900/20"
                  onClick={() => setShowNotifications(!showNotifications)}
                  data-testid="notifications-btn"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 glass-effect rounded-xl p-4 max-h-96 overflow-y-auto shadow-2xl border border-teal-800/30 animate-fadeIn z-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllRead}
                          className="text-xs text-teal-400 hover:text-teal-300 hover:bg-teal-900/20"
                        >
                          Mark all read
                        </Button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-gray-500 text-sm">No notifications</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif) => (
                          <div key={notif.id} className={`p-3 rounded-lg ${notif.read ? 'bg-gray-900/30' : 'bg-teal-900/20 border border-teal-800/30'}`}>
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
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white border-0 shadow-lg"
                  data-testid="role-dashboard-btn"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {user.role === 'admin' ? 'Admin Panel' : user.role === 'organizer' ? 'Organizer Panel' : 'Judge Panel'}
                </Button>
              )}

              {/* Find My Certificate Button */}
              <Button
                onClick={() => navigate('/get-certificate')}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white border-0 shadow-lg"
                data-testid="find-certificate-btn"
              >
                <Award className="w-4 h-4 mr-2" />
                Find My Certificate
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-teal-900/20"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              {/* Profile Button */}
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-teal-900/20"
                onClick={() => navigate('/profile')}
                data-testid="profile-btn"
              >
                <User className="w-5 h-5" />
              </Button>

              {/* Settings Button */}
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-teal-400 hover:bg-teal-900/20"
                onClick={() => navigate('/settings')}
                data-testid="settings-btn"
              >
                <Settings className="w-5 h-5" />
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

            {/* Mobile Menu Button & Notification Badge */}
            <div className="flex md:hidden items-center gap-2">
              {/* Notification Badge - Mobile */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-gray-400 hover:text-white hover:bg-teal-900/20"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>

              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-teal-900/20"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 space-y-2 animate-fadeIn">
              {/* Role Dashboard Link */}
              {(user?.role === 'admin' || user?.role === 'organizer' || user?.role === 'judge') && (
                <button
                  onClick={() => {
                    navigateByRole();
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-300 hover:text-white hover:bg-teal-900/20 transition-colors"
                >
                  <Settings className="w-5 h-5 text-teal-400" />
                  <span className="font-medium">
                    {user.role === 'admin' ? 'Admin Panel' : user.role === 'organizer' ? 'Organizer Panel' : 'Judge Panel'}
                  </span>
                </button>
              )}

              {/* Profile */}
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-300 hover:text-white hover:bg-teal-900/20 transition-colors"
              >
                <User className="w-5 h-5 text-teal-400" />
                <span className="font-medium">My Profile</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => {
                  navigate('/settings');
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-300 hover:text-white hover:bg-teal-900/20 transition-colors"
              >
                <Settings className="w-5 h-5 text-teal-400" />
                <span className="font-medium">Settings</span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-gray-300 hover:text-white hover:bg-teal-900/20 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-teal-400" /> : <Moon className="w-5 h-5 text-teal-400" />}
                <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {/* Logout */}
              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-12">
        {/* Enhanced Welcome Section */}
        <div className="relative mb-6 sm:mb-12 overflow-hidden rounded-2xl sm:rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-600/20 to-teal-700/20"></div>
          <div className="relative glass-effect p-4 sm:p-8 lg:p-10 border border-teal-800/30">
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-2xl flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <div className="text-center sm:text-left w-full">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 break-words">
                  Welcome back, <span className="gradient-text">{user?.name}</span>! 👋
                </h1>
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Ready to build something amazing?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-12">
          {[
            { icon: Trophy, label: 'Registered', value: myRegistrations.length, gradient: 'from-yellow-500 to-orange-500' },
            { icon: Users, label: 'Teams', value: myTeams.length, gradient: 'from-teal-500 to-teal-600' },
            { icon: Code, label: 'Available', value: hackathons.length, gradient: 'from-blue-500 to-cyan-500' },
            { icon: Star, label: 'Notifications', value: unreadCount, gradient: 'from-green-500 to-emerald-500' },
          ].map((stat, idx) => (
            <Card key={idx} className="glass-effect hover-lift p-3 sm:p-4 lg:p-6 border border-gray-800">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-2 sm:mb-3 lg:mb-4 shadow-lg`}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-400 truncate">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Referral Section */}
        {myReferralStats && (
          <div className="mb-6 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">
              Share & <span className="gradient-text">Earn</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Referral Stats Card */}
              <Card className="glass-effect border border-gray-800 p-4 sm:p-5 lg:p-6 lg:col-span-2">
                <div className="flex items-center gap-3 sm:gap-4 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white truncate">Your Referral Impact</h3>
                    <p className="text-xs sm:text-sm text-gray-400">Share hackathons and grow the community</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-900/30 rounded-lg">
                    <div className="text-xl sm:text-2xl font-bold text-teal-400">{myReferralStats.total_referrals || 0}</div>
                    <div className="text-xs text-gray-500">Successful Referrals</div>
                  </div>
                  <div className="text-center p-3 bg-gray-900/30 rounded-lg">
                    <div className="text-sm sm:text-lg font-bold text-gray-300 font-mono truncate px-2">{myReferralStats.referral_code}</div>
                    <div className="text-xs text-gray-500">Your Referral Code</div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs sm:text-sm text-gray-400 mb-3">
                    Get your personalized referral link for any hackathon you're registered for
                  </p>
                </div>
              </Card>

              {/* Quick Share Card */}
              <Card className="glass-effect border border-gray-800 p-4 sm:p-5 lg:p-6">
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                    <Share2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mb-2">Share Any Event</h3>
                  <p className="text-xs sm:text-sm text-gray-400 mb-4">
                    Click "Share & Earn" on any hackathon page to get your referral link
                  </p>
                  <Badge className="bg-teal-900/50 text-teal-300 border-teal-700 text-xs">
                    Available on all event pages
                  </Badge>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* My Registrations */}
        {myRegistrations.length > 0 && (
          <div className="mb-6 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">My <span className="gradient-text">Registrations</span></h2>
              <Badge className="status-badge status-live px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm flex-shrink-0">Active</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {myRegistrations.map((reg) => {
                const hackathon = hackathons.find(h => h.id === reg.hackathon_id);
                if (!hackathon) return null;

                return (
                  <Card
                    key={reg.id}
                    className="glass-effect hover-lift cursor-pointer overflow-hidden border border-purple-800/30 group"
                    onClick={() => navigate(`/hackathon/${hackathon.slug}`)}
                    data-testid={`registration-card-${reg.id}`}
                  >
                    <div className="h-40 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                      <img 
                        src={getHackathonBanner(hackathon)} 
                        alt={hackathon.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <Badge className="absolute top-3 right-3 status-badge status-live">Registered</Badge>
                    </div>
                    <div className="p-4 sm:p-5 lg:p-6">
                      <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-purple-400 transition-colors line-clamp-2">{hackathon.title}</h3>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                        <span className="truncate">{new Date(hackathon.event_start).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* My Certificates */}
        {myCertificates.length > 0 && (
          <div className="mb-6 sm:mb-12">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">My <span className="gradient-text">Certificates</span></h2>
              <Button
                onClick={() => navigate('/get-certificate')}
                variant="outline"
                className="border-teal-700 text-teal-400 hover:bg-teal-900/20 text-xs sm:text-sm"
              >
                Get Certificate
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {myCertificates.map((cert) => (
                <Card
                  key={cert.id}
                  className="glass-effect hover-lift border border-teal-800/30 group"
                >
                  <div className="p-4 sm:p-5 lg:p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate group-hover:text-teal-400 transition-colors">
                          {cert.event_name || 'Certificate'}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-400 capitalize truncate">{cert.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3 text-teal-500 flex-shrink-0" />
                        <span className="truncate">Issued: {new Date(cert.issued_date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-teal-400 font-mono truncate">
                        ID: {cert.certificate_id}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = process.env.REACT_APP_BACKEND_URL + cert.certificate_url;
                          link.download = `Certificate_${cert.user_name.replace(/\s+/g, '_')}.png`;
                          link.click();
                          toast.success('Certificate downloaded!');
                        }}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        onClick={() => navigate(`/verify-certificate/${cert.certificate_id}`)}
                        variant="outline"
                        className="flex-1 border-gray-700 text-gray-300 text-xs sm:text-sm"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* My Teams */}
        {myTeams.length > 0 && (
          <div className="mb-6 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">My <span className="gradient-text">Teams</span></h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {myTeams.map((team) => (
                <Card key={team.id} className="glass-effect hover-lift p-4 sm:p-5 lg:p-6 border border-purple-800/30" data-testid={`team-card-${team.id}`}>
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
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Available <span className="gradient-text">Hackathons</span></h2>
            <Button
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-600/10 text-sm sm:text-base whitespace-nowrap w-full sm:w-auto"
              onClick={() => navigate('/')}
            >
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Browse All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {hackathons.slice(0, 6).map((hackathon) => {
              const isRegistered = myRegistrations.some(r => r.hackathon_id === hackathon.id);

              return (
                <Card
                  key={hackathon.id}
                  className="glass-effect hover-lift overflow-hidden border border-gray-800 group"
                  data-testid={`available-hackathon-${hackathon.id}`}
                >
                  <div className="h-48 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={getHackathonBanner(hackathon)} 
                      alt={hackathon.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    {hackathon.featured && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-black px-2 py-1 rounded-full flex items-center gap-1 font-bold text-xs shadow-lg">
                        <Star className="w-3 h-3 fill-black" />
                        Featured
                      </div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">{hackathon.title}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{hackathon.description}</p>

                    <div className="space-y-2 text-xs sm:text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                        <span className="capitalize truncate">{hackathon.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                        <span className="truncate">{new Date(hackathon.event_start).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 sm:pt-4 border-t border-gray-800">
                      <Button
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs sm:text-sm"
                        onClick={() => navigate(`/hackathon/${hackathon.slug}`)}
                        data-testid={`view-details-btn-${hackathon.id}`}
                      >
                        View Details
                      </Button>
                      {!isRegistered && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-purple-600 text-purple-400 hover:bg-purple-600/10 flex-shrink-0"
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
      
      {/* Referral Modal */}
      {showReferralModal && selectedHackathonForReferral && (
        <ReferralModal
          hackathon={selectedHackathonForReferral}
          onClose={() => {
            setShowReferralModal(false);
            setSelectedHackathonForReferral(null);
          }}
        />
      )}
    </div>
  );
}
