import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rocket, Calendar, MapPin, Trophy, Users, Code, ArrowLeft, Clock, FileText, Star, Zap, Award, Twitter, Linkedin, Globe, MessageCircle, ExternalLink, User } from 'lucide-react';
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
import { getHackathonBanner } from '@/lib/bannerImages';

export default function HackathonDetailEnhanced() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [teams, setTeams] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const user = getUser();

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch hackathon by slug
      const hackathonRes = await hackathonAPI.getBySlug(slug);
      const hackathonId = hackathonRes.data.id;
      
      const [teamsRes, leaderboardRes] = await Promise.all([
        hackathonAPI.getTeams(hackathonId),
        hackathonAPI.getLeaderboard(hackathonId),
      ]);

      setHackathon(hackathonRes.data);
      setTeams(teamsRes.data);
      setLeaderboard(leaderboardRes.data);

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

    // Check if user is a participant
    if (user && user.role !== 'participant') {
      toast.error('Only participants can register for hackathons');
      return;
    }

    try {
      await registrationAPI.register(hackathon.id);
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
      const currentUser = getUser();
      if (currentUser && currentUser.role === 'participant') {
        try {
          await registrationAPI.register(pendingHackathonId);
          toast.success('Successfully registered for the hackathon!');
          localStorage.removeItem('pendingHackathonRegistration');
          fetchData();
        } catch (error) {
          console.error('Auto-registration failed:', error);
          toast.error(error.response?.data?.detail || 'Registration failed');
          localStorage.removeItem('pendingHackathonRegistration');
        }
      } else {
        localStorage.removeItem('pendingHackathonRegistration');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!hackathon) {
    return <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white">Hackathon not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Navbar */}
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/')}
              className="text-gray-400 hover:text-white"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Hackov8</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <img 
          src={getHackathonBanner(hackathon)} 
          alt={hackathon.title} 
          className="absolute inset-0 w-full h-full object-cover" 
          onError={(e) => {
            e.target.style.display = 'none';
            console.error('Failed to load banner image:', getHackathonBanner(hackathon));
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/80 to-transparent"></div>
        
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-6 pb-12">
            <div className="max-w-4xl">
              <Badge className="status-badge status-live mb-4 text-base px-6 py-2">{hackathon.status}</Badge>
              <h1 className="text-6xl font-bold mb-4 text-white drop-shadow-2xl">{hackathon.title}</h1>
              <p className="text-gray-200 text-xl max-w-3xl drop-shadow-lg leading-relaxed">{hackathon.description}</p>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="glass-effect px-4 py-2 rounded-xl border border-purple-800/30">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-semibold">{teams.length} Teams</span>
                  </div>
                </div>
                <div className="glass-effect px-4 py-2 rounded-xl border border-purple-800/30">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    <span className="text-white font-semibold">{hackathon.prizes.length} Prizes</span>
                  </div>
                </div>
                <div className="glass-effect px-4 py-2 rounded-xl border border-purple-800/30">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    <span className="text-white font-semibold capitalize">{hackathon.location}</span>
                  </div>
                </div>
              </div>

              {/* Social Links & Community */}
              {(hackathon.twitter_url || hackathon.linkedin_url || hackathon.website_url || hackathon.community_url) && (
                <div className="flex flex-wrap gap-3 mt-6">
                  {hackathon.twitter_url && (
                    <a
                      href={hackathon.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-effect px-4 py-2 rounded-xl border border-blue-400/30 hover:border-blue-400 transition-all flex items-center gap-2 text-white hover:bg-blue-500/10"
                    >
                      <Twitter className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium">Twitter</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  )}
                  {hackathon.linkedin_url && (
                    <a
                      href={hackathon.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-effect px-4 py-2 rounded-xl border border-blue-600/30 hover:border-blue-600 transition-all flex items-center gap-2 text-white hover:bg-blue-600/10"
                    >
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">LinkedIn</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  )}
                  {hackathon.website_url && (
                    <a
                      href={hackathon.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-effect px-4 py-2 rounded-xl border border-green-500/30 hover:border-green-500 transition-all flex items-center gap-2 text-white hover:bg-green-500/10"
                    >
                      <Globe className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Website</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  )}
                  {hackathon.community_url && (
                    <a
                      href={hackathon.community_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-effect px-4 py-2 rounded-xl border border-teal-500/30 hover:border-teal-500 transition-all flex items-center gap-2 text-white hover:bg-teal-500/10 animate-pulse"
                    >
                      <MessageCircle className="w-4 h-4 text-teal-500" />
                      <span className="text-sm font-medium">Join {hackathon.community_type === 'slack' ? 'Slack' : hackathon.community_type === 'discord' ? 'Discord' : 'Community'}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-gray-900/50 p-2 rounded-2xl border border-gray-800">
                <TabsTrigger value="overview" className="rounded-xl" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="prizes" className="rounded-xl" data-testid="tab-prizes">Prizes</TabsTrigger>
                <TabsTrigger value="rules" className="rounded-xl" data-testid="tab-rules">Rules</TabsTrigger>
                <TabsTrigger value="leaderboard" className="rounded-xl" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="glass-effect p-8 border border-purple-800/30 hover-lift">
                  <h2 className="text-3xl font-bold mb-4 gradient-text">About This Hackathon</h2>
                  <p className="text-gray-300 leading-relaxed text-lg">{hackathon.description}</p>
                </Card>

                <Card className="glass-effect p-8 border border-teal-200 hover-lift">
                  <h2 className="text-3xl font-bold mb-6 gradient-text">Event Timeline</h2>
                  <div className="relative">
                    {/* Timeline Line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-teal-400 to-teal-500"></div>
                    
                    <div className="space-y-6">
                      {[
                        { label: 'Registration Opens', date: hackathon.registration_start, icon: Calendar, color: 'from-blue-500 to-blue-600' },
                        { label: 'Registration Closes', date: hackathon.registration_end, icon: Clock, color: 'from-teal-500 to-teal-600' },
                        { label: 'Event Starts', date: hackathon.event_start, icon: Zap, color: 'from-green-500 to-green-600' },
                        { label: 'Event Ends', date: hackathon.event_end, icon: Clock, color: 'from-orange-500 to-orange-600' },
                        { label: 'Submission Deadline', date: hackathon.submission_deadline, icon: FileText, color: 'from-red-500 to-red-600' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 relative">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg z-10 border-4 border-white`}>
                            <item.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 p-4 bg-gradient-to-r from-teal-50 to-white rounded-xl border border-teal-200 hover:border-teal-400 transition-all hover:shadow-md">
                            <p className="font-semibold text-gray-900 text-lg">{item.label}</p>
                            <p className="text-teal-600 font-medium">{new Date(item.date).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {hackathon.faqs.length > 0 && (
                  <Card className="glass-effect p-8 border border-purple-800/30 hover-lift">
                    <h2 className="text-3xl font-bold mb-6 gradient-text">FAQs</h2>
                    <div className="space-y-4">
                      {hackathon.faqs.map((faq, idx) => (
                        <div key={idx} className="p-4 bg-gray-900/30 rounded-xl border border-gray-800">
                          <p className="font-semibold text-white mb-2 text-lg">{faq.question}</p>
                          <p className="text-gray-400">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="prizes">
                <Card className="glass-effect p-8 border border-purple-800/30 hover-lift">
                  <h2 className="text-3xl font-bold mb-8 gradient-text">Prizes & Rewards</h2>
                  <div className="space-y-4">
                    {hackathon.prizes.map((prize, idx) => (
                      <div key={idx} className="card-gradient p-6 rounded-2xl hover-lift border border-purple-800/30">
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${idx === 0 ? 'from-yellow-500 to-orange-500' : idx === 1 ? 'from-gray-400 to-gray-600' : 'from-orange-600 to-red-600'} flex items-center justify-center shadow-lg`}>
                            <Trophy className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-2xl text-white mb-2">{prize.place}</h3>
                            <p className="text-purple-400 font-bold text-xl mb-2">{prize.amount}</p>
                            {prize.description && <p className="text-gray-400">{prize.description}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="rules">
                <Card className="glass-effect p-8 border border-purple-800/30 hover-lift">
                  <h2 className="text-3xl font-bold mb-6 gradient-text">Rules & Guidelines</h2>
                  <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">{hackathon.rules || 'No specific rules provided.'}</div>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card className="glass-effect p-8 border border-purple-800/30 hover-lift">
                  <h2 className="text-3xl font-bold mb-8 gradient-text">Leaderboard</h2>
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No submissions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-6 rounded-2xl ${idx < 3 ? 'card-gradient border border-purple-800/50' : 'bg-gray-900/50 border border-gray-800'} hover-lift`}>
                          <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-xl ${idx === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' : idx === 2 ? 'bg-gradient-to-br from-orange-600 to-red-600' : 'bg-gray-800'} flex items-center justify-center shadow-lg`}>
                              <span className="text-2xl font-bold text-white">#{idx + 1}</span>
                            </div>
                            <div>
                              <p className="font-bold text-white text-xl">{entry.team_name}</p>
                              <p className="text-gray-400">{entry.project_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-4xl font-bold gradient-text">{entry.average_score}</p>
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
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="glass-effect p-6 border border-purple-800/30 sticky top-24" data-testid="action-card">
              {!isAuthenticated() ? (
                <div className="space-y-4">
                  <Button
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-xl"
                    onClick={() => setShowAuthModal(true)}
                    data-testid="signup-to-register-btn"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Sign Up to Register
                  </Button>
                  <p className="text-gray-400 text-sm text-center">Create a participant account to join this hackathon</p>
                </div>
              ) : !isRegistered ? (
                <div className="space-y-4">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg font-bold shadow-xl"
                    onClick={handleRegister}
                    data-testid="register-hackathon-btn"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Register Now
                  </Button>
                  <p className="text-gray-400 text-sm text-center">Join and start building amazing projects!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge className="status-badge status-live w-full justify-center py-2 text-base">✅ Registered</Badge>
                  {!myTeam ? (
                    <>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        onClick={() => setShowCreateTeam(true)}
                        data-testid="create-team-btn"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Create Team
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-purple-600 text-purple-400 hover:bg-purple-600/10"
                        onClick={() => setShowJoinTeam(true)}
                        data-testid="join-team-btn"
                      >
                        Join Team
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
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="glass-effect p-6 border border-purple-800/30">
              <h3 className="font-bold text-xl mb-6 gradient-text">Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-900/30 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Location</p>
                    <p className="text-white font-semibold capitalize">{hackathon.location}</p>
                    {hackathon.venue && <p className="text-gray-500 text-xs mt-1">{hackathon.venue}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Team Size</p>
                    <p className="text-white font-semibold">{hackathon.min_team_size}-{hackathon.max_team_size} members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-900/30 rounded-lg">
                  <Code className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400 text-sm">Category</p>
                    <p className="text-white font-semibold capitalize">{hackathon.category}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Connect with Organizers Card */}
            {(hackathon.twitter_url || hackathon.linkedin_url || hackathon.website_url || hackathon.community_url) && (
              <Card className="glass-effect p-6 border border-teal-500/30">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-teal-500" />
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
    </div>
  );
}
