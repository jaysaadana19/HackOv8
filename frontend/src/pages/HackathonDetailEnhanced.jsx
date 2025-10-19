import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rocket, Calendar, MapPin, Trophy, Users, Code, ArrowLeft, Clock, FileText, Star, Zap, Award, Twitter, Linkedin, Globe, MessageCircle, ExternalLink, User, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { hackathonAPI, registrationAPI, teamAPI, submissionAPI } from '@/lib/api';
import { isAuthenticated, getUser } from '@/lib/auth';
import CreateTeamModal from '@/components/CreateTeamModal';
import JoinTeamModal from '@/components/JoinTeamModal';
import SubmitProjectModal from '@/components/SubmitProjectModal';
import AuthModal from '@/components/AuthModal';
import ReferralModal from '@/components/ReferralModal';
import { getHackathonBanner } from '@/lib/bannerImages';

export default function HackathonDetailEnhanced() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [myTeam, setMyTeam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralData, setReferralData] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const user = getUser();

  useEffect(() => {
    // Parse URL parameters for referral tracking
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const utm_source = urlParams.get('utm_source');
    const utm_campaign = urlParams.get('utm_campaign'); 
    const utm_medium = urlParams.get('utm_medium');
    
    if (ref || utm_source) {
      setReferralData({
        ref,
        utm_source,
        utm_campaign,
        utm_medium
      });
    }
    
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hackathon by slug
      const hackathonRes = await hackathonAPI.getBySlug(slug);
      const hackathonId = hackathonRes.data.id;
      
      const [teamsRes, leaderboardRes, regCountRes] = await Promise.all([
        hackathonAPI.getTeams(hackathonId),
        hackathonAPI.getLeaderboard(hackathonId),
        hackathonAPI.getRegistrationCount(hackathonId),
      ]);

      setHackathon(hackathonRes.data);
      setTeams(teamsRes.data);
      setLeaderboard(leaderboardRes.data);
      setRegistrationCount(regCountRes.data.count);

      // Only fetch user-specific data if authenticated
      if (isAuthenticated()) {
        const regsRes = await registrationAPI.getMyRegistrations();
        const registered = regsRes.data.some(r => r.hackathon_id === hackathonId);
        setIsRegistered(registered);

        const myTeamsRes = await teamAPI.getMy();
        const team = myTeamsRes.data.find(t => t.hackathon_id === hackathonId);
        setMyTeam(team);

        if (team) {
          const subRes = await submissionAPI.getTeamSubmission(team.id, hackathonId);
          setSubmission(subRes.data);
        }
      }
    } catch (error) {
      toast.error('Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // Store hackathon ID for post-auth registration
      localStorage.setItem('pendingHackathonRegistration', hackathon.id);
      setShowAuthModal(true);
      return;
    }

    // Get fresh user data from localStorage
    let currentUser = getUser();
    
    // If role is missing (old session), fetch from backend
    if (currentUser && !currentUser.role) {
      console.log('Role missing, fetching from backend...');
      try {
        const response = await authAPI.getCurrentUser();
        currentUser = response.data;
        // Update localStorage with complete user data
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Please log out and log in again');
        return;
      }
    }
    
    // Check if user is a participant
    if (currentUser && currentUser.role !== 'participant') {
      toast.error('Only participants can register for hackathons');
      return;
    }

    try {
      await registrationAPI.register(hackathon.id, null, referralData);
      toast.success('Registered successfully!');
      setIsRegistered(true);
      // Clear pending registration if any
      localStorage.removeItem('pendingHackathonRegistration');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const completeRegistration = async () => {
    const pendingHackathonId = localStorage.getItem('pendingHackathonRegistration');
    if (pendingHackathonId && isAuthenticated()) {
      // Get fresh user data from localStorage
      let currentUser = getUser();
      
      console.log('Complete Registration - User:', currentUser);
      
      if (!currentUser) {
        console.error('No user found in localStorage');
        localStorage.removeItem('pendingHackathonRegistration');
        return;
      }
      
      // If role is missing (old session), fetch from backend
      if (!currentUser.role) {
        console.log('Role missing in localStorage, fetching from backend...');
        try {
          const response = await authAPI.getCurrentUser();
          currentUser = response.data;
          // Update localStorage with complete user data
          localStorage.setItem('user', JSON.stringify(currentUser));
          console.log('Updated user with role:', currentUser);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          toast.error('Please log out and log in again');
          localStorage.removeItem('pendingHackathonRegistration');
          return;
        }
      }
      
      if (currentUser.role !== 'participant') {
        console.log('User role is not participant:', currentUser.role);
        toast.info('Only participants can register for hackathons');
        localStorage.removeItem('pendingHackathonRegistration');
        return;
      }
      
      try {
        await registrationAPI.register(pendingHackathonId, null, referralData);
        toast.success('Successfully registered for the hackathon!');
        localStorage.removeItem('pendingHackathonRegistration');
        setIsRegistered(true);
        fetchData();
      } catch (error) {
        console.error('Auto-registration failed:', error);
        toast.error(error.response?.data?.detail || 'Registration failed');
        localStorage.removeItem('pendingHackathonRegistration');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!hackathon) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-900">Hackathon not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/')}
              className="text-gray-600 hover:text-teal-600 p-2"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold gradient-text">Hackov8</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-teal-50 to-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="max-w-4xl">
            <Badge className="status-badge status-live mb-3 sm:mb-4 text-xs sm:text-base px-4 sm:px-6 py-1.5 sm:py-2">{hackathon.status}</Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 text-gray-900">{hackathon.title}</h1>
            <p className="text-gray-700 text-sm sm:text-lg md:text-xl max-w-3xl leading-relaxed mb-6">{hackathon.description}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-2 sm:gap-4">
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <span className="text-gray-900 font-semibold">{registrationCount} Registered</span>
                  </div>
                </div>
                {/* Show team size info */}
                {hackathon.min_team_size === 1 && hackathon.max_team_size === 1 ? (
                  <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-teal-600" />
                      <span className="text-gray-900 font-semibold">Solo Participation</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-teal-600" />
                      <span className="text-gray-900 font-semibold">{hackathon.min_team_size}-{hackathon.max_team_size} Team Size</span>
                    </div>
                  </div>
                )}
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                    <span className="text-gray-900 font-semibold">{hackathon.prizes.length} Prizes</span>
                  </div>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-600" />
                    <span className="text-gray-900 font-semibold capitalize">{hackathon.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Social Links Bar - Moved outside hero */}
      {(hackathon.twitter_url || hackathon.linkedin_url || hackathon.website_url || hackathon.community_url) && (
        <div className="bg-white border-b border-gray-200 py-4">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex flex-wrap gap-3">
              {hackathon.twitter_url && (
                <a
                  href={hackathon.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:border-teal-600 transition-all flex items-center gap-2 text-gray-700 hover:text-teal-600 hover:bg-teal-50"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">Twitter</span>
                  <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {hackathon.linkedin_url && (
                    <a
                      href={hackathon.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border border-gray-200 hover:border-teal-600 transition-all flex items-center gap-2 text-gray-700 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm font-medium">LinkedIn</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {hackathon.website_url && (
                    <a
                      href={hackathon.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border border-gray-200 hover:border-teal-600 transition-all flex items-center gap-2 text-gray-700 hover:text-teal-600 hover:bg-teal-50"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {hackathon.community_url && (
                    <a
                      href={hackathon.community_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg border border-teal-600 bg-teal-50 hover:bg-teal-100 transition-all flex items-center gap-2 text-teal-700 font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Join {hackathon.community_type === 'slack' ? 'Slack' : hackathon.community_type === 'discord' ? 'Discord' : 'Community'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
        )}

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <TabsList className="bg-white p-1.5 sm:p-2 rounded-xl border border-gray-200 shadow-sm w-full overflow-x-auto flex justify-start sm:justify-center">
                <TabsTrigger value="overview" className="rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="prizes" className="rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700" data-testid="tab-prizes">Prizes</TabsTrigger>
                <TabsTrigger value="rules" className="rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700" data-testid="tab-rules">Rules</TabsTrigger>
                <TabsTrigger value="leaderboard" className="rounded-lg text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 gradient-text">About This Hackathon</h2>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-lg">{hackathon.description}</p>
                </Card>

                <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text">Event Timeline</h2>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 via-teal-500 to-teal-600"></div>
                    
                    <div className="space-y-6">
                      {[
                        { label: 'Registration Opens', date: hackathon.registration_start, icon: Calendar, color: 'from-blue-500 to-blue-600' },
                        { label: 'Registration Closes', date: hackathon.registration_end, icon: Clock, color: 'from-teal-500 to-teal-600' },
                        { label: 'Event Starts', date: hackathon.event_start, icon: Zap, color: 'from-green-500 to-green-600' },
                        { label: 'Event Ends', date: hackathon.event_end, icon: Clock, color: 'from-orange-500 to-orange-600' },
                        { label: 'Submission Deadline', date: hackathon.submission_deadline, icon: FileText, color: 'from-red-500 to-red-600' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 relative">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md z-10 border-4 border-white`}>
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-400 transition-all hover:shadow-md">
                            <p className="font-semibold text-gray-900 text-base sm:text-lg">{item.label}</p>
                            <p className="text-teal-600 font-medium text-sm sm:text-base">{new Date(item.date).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {hackathon.faqs.length > 0 && (
                  <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text">FAQs</h2>
                    <div className="space-y-4">
                      {hackathon.faqs.map((faq, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <p className="font-semibold text-gray-900 mb-2 text-base sm:text-lg">{faq.question}</p>
                          <p className="text-gray-400">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}


                {/* Sponsors Section */}
                {hackathon.sponsors && hackathon.sponsors.length > 0 && (
                  <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 gradient-text">Our Sponsors</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                      {hackathon.sponsors.map((sponsor, idx) => (
                        <a
                          key={idx}
                          href={sponsor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3"
                        >
                          {sponsor.logo && (
                            <img
                              src={sponsor.logo}
                              alt={sponsor.name}
                              className="w-full h-16 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-gray-900 font-semibold text-center text-sm">{sponsor.name}</p>
                        </a>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Judges Section */}
                {hackathon.judges && hackathon.judges.length > 0 && (
                  <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 gradient-text">Meet Our Judges</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {hackathon.judges.map((judge, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-white rounded-xl border border-gray-200 hover:border-teal-400 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start gap-4">
                            {judge.photo && (
                              <img
                                src={judge.photo}
                                alt={judge.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-teal-500"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-gray-900 font-bold text-lg">{judge.name}</h3>
                              {judge.bio && <p className="text-gray-600 text-sm mt-1">{judge.bio}</p>}
                              {judge.linkedin && (
                                <a
                                  href={judge.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 mt-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                                >
                                  <Linkedin className="w-4 h-4" />
                                  LinkedIn
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

              </TabsContent>

              <TabsContent value="prizes">
                <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 gradient-text">Prizes & Rewards</h2>
                  <div className="space-y-4">
                    {hackathon.prizes.map((prize, idx) => (
                      <div key={idx} className="card-gradient p-4 sm:p-6 rounded-2xl hover-lift border border-gray-200">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${idx === 0 ? 'from-yellow-500 to-orange-500' : idx === 1 ? 'from-gray-400 to-gray-600' : 'from-orange-600 to-red-600'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl sm:text-2xl text-gray-900 mb-1 sm:mb-2">{prize.place}</h3>
                            <p className="text-teal-600 font-bold text-lg sm:text-xl mb-1 sm:mb-2">{prize.amount}</p>
                            {prize.description && <p className="text-gray-600 text-sm sm:text-base">{prize.description}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="rules">
                <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 gradient-text">Rules & Guidelines</h2>
                  <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm sm:text-lg">{hackathon.rules || 'No specific rules provided.'}</div>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card className="glass-effect p-4 sm:p-8 border border-gray-200 hover-lift shadow-sm">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 gradient-text">Leaderboard</h2>
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <Award className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-base sm:text-lg">No submissions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, idx) => (
                        <div key={idx} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl ${idx < 3 ? 'bg-teal-50 border border-teal-200' : 'bg-white border border-gray-200'} hover-lift gap-4 hover:shadow-md transition-all`}>
                          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${idx === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : idx === 2 ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gray-300'} flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <span className="text-xl sm:text-2xl font-bold text-white">#{idx + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 text-lg sm:text-xl truncate">{entry.team_name}</p>
                              <p className="text-gray-600 text-sm sm:text-base truncate">{entry.project_name}</p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            <p className="text-3xl sm:text-4xl font-bold gradient-text">{entry.average_score}</p>
                            <p className="text-xs text-gray-500 mt-1">{entry.judge_count} judges</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24">
            {/* Action Card */}
            <Card className="glass-effect p-4 sm:p-6 border border-gray-200 shadow-lg" data-testid="action-card">
              {!isAuthenticated() ? (
                <div className="space-y-4">
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                    onClick={() => setShowAuthModal(true)}
                    data-testid="signup-to-register-btn"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Sign Up to Register
                  </Button>
                  
                  {/* Share & Earn Button for Non-Registered Users */}
                  <Button
                    variant="outline"
                    className="w-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 py-3 font-semibold"
                    onClick={() => setShowReferral(true)}
                    data-testid="share-earn-non-registered-btn"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share & Earn
                  </Button>
                  
                  <p className="text-gray-600 text-sm text-center">Create a participant account to join this hackathon</p>
                </div>
              ) : !isRegistered ? (
                <div className="space-y-4">
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                    onClick={handleRegister}
                    data-testid="register-hackathon-btn"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Register Now
                  </Button>
                  
                  {/* Share & Earn Button */}
                  <Button
                    variant="outline"
                    className="w-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 py-3 font-semibold"
                    onClick={() => setShowReferral(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share & Earn
                  </Button>
                  
                  <p className="text-gray-600 text-sm text-center">Join and start building amazing projects!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge className="status-badge status-live w-full justify-center py-2 text-base">✅ Registered</Badge>
                  
                  {/* Solo participation - no teams needed */}
                  {hackathon.min_team_size === 1 && hackathon.max_team_size === 1 ? (
                    <>
                      <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                        <p className="text-sm text-gray-600 mb-2">Participation Mode</p>
                        <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-teal-600" />
                          Solo Participation
                        </p>
                        <p className="text-sm text-gray-600 mt-1">You're registered as an individual</p>
                      </div>
                      {!submission && (
                        <Button
                          className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all"
                          onClick={() => setShowSubmit(true)}
                          data-testid="submit-project-btn"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Submit Project
                        </Button>
                      )}
                      
                      {/* Share & Earn for Solo Participants */}
                      <Button
                        variant="outline"
                        className="w-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 py-3 font-semibold"
                        onClick={() => setShowReferral(true)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share & Earn
                      </Button>
                    </>
                  ) : !myTeam ? (
                    /* Team participation - show team creation/join options */
                    <>
                      <Button
                        className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg transition-all"
                        onClick={() => setShowCreateTeam(true)}
                        data-testid="create-team-btn"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Create Team
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-teal-600 text-teal-600 hover:bg-teal-50"
                        onClick={() => setShowJoinTeam(true)}
                        data-testid="join-team-btn"
                      >
                        Join Team
                      </Button>
                      
                      {/* Share & Earn for Team Participants */}
                      <Button
                        variant="outline"
                        className="w-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 py-3 font-semibold"
                        onClick={() => setShowReferral(true)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share & Earn
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-800/30">
                        <p className="text-sm text-gray-400 mb-2">Your Team</p>
                        <p className="font-bold text-white text-lg">{myTeam.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{myTeam.members.length} members</p>
                      </div>
                      {!submission && (
                        <Button
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          onClick={() => setShowSubmit(true)}
                          data-testid="submit-project-btn"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Submit Project
                        </Button>
                      )}
                      {submission && (
                        <div className="p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-800/50 rounded-xl">
                          <p className="text-green-400 font-bold mb-1 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Project Submitted
                          </p>
                          <p className="text-sm text-gray-300">{submission.project_name}</p>
                        </div>
                      )}
                      
                      {/* Share & Earn for Team Members */}
                      <Button
                        variant="outline"
                        className="w-full border-2 border-teal-200 text-teal-700 hover:bg-teal-50 py-3 font-semibold"
                        onClick={() => setShowReferral(true)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share & Earn
                      </Button>
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="glass-effect p-4 sm:p-6 border border-gray-200 shadow-md">
              <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 gradient-text">Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-gray-600 text-sm">Location</p>
                    <p className="text-gray-900 font-semibold capitalize">{hackathon.location}</p>
                    {hackathon.venue && <p className="text-gray-500 text-xs mt-1">{hackathon.venue}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Users className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-gray-600 text-sm">Team Size</p>
                    <p className="text-gray-900 font-semibold">{hackathon.min_team_size}-{hackathon.max_team_size} members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <Code className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-gray-600 text-sm">Category</p>
                    <p className="text-gray-900 font-semibold capitalize">{hackathon.category}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Connect with Organizers Card */}
            {(hackathon.twitter_url || hackathon.linkedin_url || hackathon.website_url || hackathon.community_url) && (
              <Card className="glass-effect p-4 sm:p-6 border border-teal-200 bg-teal-50/50 shadow-md">
                <h3 className="font-bold text-lg sm:text-xl mb-4 sm:mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-600" />
                  <span className="gradient-text">Connect with Us</span>
                </h3>
                <div className="space-y-3">
                  {hackathon.twitter_url && (
                    <a
                      href={hackathon.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 rounded-lg border border-blue-400/30 hover:border-blue-400 transition-all hover:shadow-lg group"
                    >
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                        <Twitter className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">Follow on Twitter</p>
                        <p className="text-gray-400 text-xs">Stay updated with announcements</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                    </a>
                  )}
                  {hackathon.linkedin_url && (
                    <a
                      href={hackathon.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-600/10 to-blue-700/10 rounded-lg border border-blue-600/30 hover:border-blue-600 transition-all hover:shadow-lg group"
                    >
                      <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center group-hover:bg-blue-600/30 transition-all">
                        <Linkedin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">Connect on LinkedIn</p>
                        <p className="text-gray-400 text-xs">Professional networking</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </a>
                  )}
                  {hackathon.website_url && (
                    <a
                      href={hackathon.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500/10 to-green-600/10 rounded-lg border border-green-500/30 hover:border-green-500 transition-all hover:shadow-lg group"
                    >
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-all">
                        <Globe className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm">Visit Website</p>
                        <p className="text-gray-400 text-xs">Learn more about us</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </a>
                  )}
                  {hackathon.community_url && (
                    <a
                      href={hackathon.community_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-500/20 to-teal-600/20 rounded-lg border-2 border-teal-500/50 hover:border-teal-500 transition-all hover:shadow-xl group animate-pulse hover:animate-none"
                    >
                      <div className="w-12 h-12 bg-teal-500/30 rounded-lg flex items-center justify-center group-hover:bg-teal-500/40 transition-all">
                        <MessageCircle className="w-6 h-6 text-teal-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-bold text-base">
                          Join {hackathon.community_type === 'slack' ? 'Slack' : hackathon.community_type === 'discord' ? 'Discord' : 'Community'}
                        </p>
                        <p className="text-teal-300 text-xs font-medium">Chat with participants & organizers</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-teal-400 group-hover:text-teal-300 transition-colors" />
                    </a>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateTeam && (
        <CreateTeamModal
          hackathonId={id}
          onClose={() => setShowCreateTeam(false)}
          onSuccess={() => {
            setShowCreateTeam(false);
            fetchData();
          }}
        />
      )}
      {showJoinTeam && (
        <JoinTeamModal
          onClose={() => setShowJoinTeam(false)}
          onSuccess={() => {
            setShowJoinTeam(false);
            fetchData();
          }}
        />
      )}
      {showSubmit && myTeam && (
        <SubmitProjectModal
          teamId={myTeam.id}
          hackathonId={id}
          onClose={() => setShowSubmit(false)}
          onSuccess={() => {
            setShowSubmit(false);
            fetchData();
          }}
        />
      )}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            // Complete registration after successful auth
            setTimeout(() => completeRegistration(), 500);
          }}
        />
      )}
      {showReferral && hackathon && (
        <ReferralModal
          hackathon={hackathon}
          onClose={() => setShowReferral(false)}
        />
      )}
    </div>
  );
}
