import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rocket, Calendar, MapPin, Trophy, Users, Code, ArrowLeft, Clock, FileText } from 'lucide-react';
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

export default function HackathonDetail() {
  const { id } = useParams();
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
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hackathonRes, teamsRes, leaderboardRes] = await Promise.all([
        hackathonAPI.getById(id),
        hackathonAPI.getTeams(id),
        hackathonAPI.getLeaderboard(id),
      ]);

      setHackathon(hackathonRes.data);
      setTeams(teamsRes.data);
      setLeaderboard(leaderboardRes.data);

      // Check if registered
      const regsRes = await registrationAPI.getMyRegistrations();
      const registered = regsRes.data.some(r => r.hackathon_id === id);
      setIsRegistered(registered);

      // Check if user has a team
      const myTeamsRes = await teamAPI.getMy();
      const team = myTeamsRes.data.find(t => t.hackathon_id === id);
      setMyTeam(team);

      // Check if team has submission
      if (team) {
        const subRes = await submissionAPI.getTeamSubmission(team.id, id);
        setSubmission(subRes.data);
      }
    } catch (error) {
      toast.error('Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      await registrationAPI.register(id);
      toast.success('Registered successfully!');
      setIsRegistered(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
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
      <nav className="border-b border-gray-900 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Rocket className="w-6 h-6 text-purple-500" />
              <span className="text-xl font-bold gradient-text">Hackov8</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-purple-600/30 to-purple-900/30 overflow-hidden">
        {hackathon.cover_image ? (
          <>
            <img src={hackathon.cover_image} alt={hackathon.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-purple-900/30" />
        )}
        <div className="relative container mx-auto px-6 h-full flex items-end pb-8">
          <div>
            <Badge className="status-badge status-live mb-4">{hackathon.status}</Badge>
            <h1 className="text-5xl font-bold mb-3 text-white drop-shadow-lg">{hackathon.title}</h1>
            <p className="text-gray-200 text-lg max-w-3xl drop-shadow-md">{hackathon.description}</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-gray-900/50">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="prizes" data-testid="tab-prizes">Prizes</TabsTrigger>
                <TabsTrigger value="rules" data-testid="tab-rules">Rules</TabsTrigger>
                <TabsTrigger value="leaderboard" data-testid="tab-leaderboard">Leaderboard</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="glass-effect p-6">
                  <h2 className="text-2xl font-bold mb-4 text-white">About</h2>
                  <p className="text-gray-400">{hackathon.description}</p>
                </Card>

                <Card className="glass-effect p-6">
                  <h2 className="text-2xl font-bold mb-4 text-white">Timeline</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Registration Opens', date: hackathon.registration_start },
                      { label: 'Registration Closes', date: hackathon.registration_end },
                      { label: 'Event Starts', date: hackathon.event_start },
                      { label: 'Event Ends', date: hackathon.event_end },
                      { label: 'Submission Deadline', date: hackathon.submission_deadline },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4 text-gray-300">
                        <Clock className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-semibold">{item.label}</p>
                          <p className="text-sm text-gray-500">{new Date(item.date).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {hackathon.faqs.length > 0 && (
                  <Card className="glass-effect p-6">
                    <h2 className="text-2xl font-bold mb-4 text-white">FAQs</h2>
                    <div className="space-y-4">
                      {hackathon.faqs.map((faq, idx) => (
                        <div key={idx}>
                          <p className="font-semibold text-white mb-2">{faq.question}</p>
                          <p className="text-gray-400 text-sm">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="prizes">
                <Card className="glass-effect p-6">
                  <h2 className="text-2xl font-bold mb-6 text-white">Prizes</h2>
                  <div className="space-y-4">
                    {hackathon.prizes.map((prize, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-purple-900/10 rounded-lg border border-purple-800/30">
                        <Trophy className="w-6 h-6 text-yellow-500 mt-1" />
                        <div>
                          <h3 className="font-bold text-lg text-white">{prize.place}</h3>
                          <p className="text-purple-400 font-semibold">{prize.amount}</p>
                          {prize.description && <p className="text-gray-400 text-sm mt-1">{prize.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="rules">
                <Card className="glass-effect p-6">
                  <h2 className="text-2xl font-bold mb-4 text-white">Rules & Guidelines</h2>
                  <div className="text-gray-400 whitespace-pre-wrap">{hackathon.rules || 'No specific rules provided.'}</div>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard">
                <Card className="glass-effect p-6">
                  <h2 className="text-2xl font-bold mb-6 text-white">Leaderboard</h2>
                  {leaderboard.length === 0 ? (
                    <p className="text-gray-500">No submissions yet</p>
                  ) : (
                    <div className="space-y-3">
                      {leaderboard.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-purple-500">#{idx + 1}</span>
                            <div>
                              <p className="font-semibold text-white">{entry.team_name}</p>
                              <p className="text-sm text-gray-400">{entry.project_name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold gradient-text">{entry.average_score}</p>
                            <p className="text-xs text-gray-500">{entry.judge_count} judges</p>
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
            <Card className="glass-effect p-6" data-testid="action-card">
              {!isRegistered ? (
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
                  onClick={handleRegister}
                  data-testid="register-hackathon-btn"
                >
                  Register Now
                </Button>
              ) : (
                <div className="space-y-4">
                  <Badge className="status-badge status-live">Registered</Badge>
                  {!myTeam ? (
                    <>
                      <Button
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => setShowCreateTeam(true)}
                        data-testid="create-team-btn"
                      >
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
                      <div className="p-4 bg-gray-900/50 rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">Your Team</p>
                        <p className="font-semibold text-white">{myTeam.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{myTeam.members.length} members</p>
                      </div>
                      {!submission && (
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => setShowSubmit(true)}
                          data-testid="submit-project-btn"
                        >
                          Submit Project
                        </Button>
                      )}
                      {submission && (
                        <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                          <p className="text-green-400 font-semibold mb-1">Project Submitted</p>
                          <p className="text-sm text-gray-400">{submission.project_name}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="glass-effect p-6">
              <h3 className="font-bold text-lg mb-4 text-white">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400">Location</p>
                    <p className="text-white font-semibold capitalize">{hackathon.location}</p>
                    {hackathon.venue && <p className="text-gray-500 text-xs mt-1">{hackathon.venue}</p>}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400">Team Size</p>
                    <p className="text-white font-semibold">{hackathon.min_team_size}-{hackathon.max_team_size} members</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="text-gray-400">Category</p>
                    <p className="text-white font-semibold capitalize">{hackathon.category}</p>
                  </div>
                </div>
              </div>
            </Card>
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
    </div>
  );
}
