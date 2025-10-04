import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Trophy, Users, Code, Calendar, MapPin, ArrowRight, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, authAPI } from '@/lib/api';
import { isAuthenticated, setAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';

export default function Landing() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Check for session_id in URL fragment
    const fragment = window.location.hash;
    if (fragment && fragment.includes('session_id=')) {
      handleAuthCallback(fragment);
      return;
    }

    // Check if already authenticated
    if (isAuthenticated()) {
      navigate('/dashboard');
      return;
    }

    fetchHackathons();
  }, []);

  const handleAuthCallback = async (fragment) => {
    setLoading(true);
    const sessionId = fragment.split('session_id=')[1]?.split('&')[0];
    
    if (!sessionId) {
      toast.error('Invalid session');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.processSession(sessionId);
      const { session_token, ...user } = response.data;
      
      setAuth(session_token, user);
      
      // Clean URL
      window.history.replaceState({}, document.title, '/dashboard');
      
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Authentication failed');
      window.history.replaceState({}, document.title, '/');
    } finally {
      setLoading(false);
    }
  };

  const fetchHackathons = async () => {
    try {
      const response = await hackathonAPI.getAll({ status: 'published' });
      setHackathons(response.data);
    } catch (error) {
      console.error('Failed to fetch hackathons', error);
    }
  };

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    navigate('/dashboard');
  };

  const filteredHackathons = hackathons.filter((h) => {
    const matchesSearch = h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = !filterLocation || h.location === filterLocation;
    return matchesSearch && matchesLocation;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-6 py-20">
          {/* Navbar */}
          <nav className="flex items-center justify-between mb-20" data-testid="landing-navbar">
            <div className="flex items-center space-x-2">
              <Rocket className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold gradient-text">Hackov8</span>
            </div>
            <Button 
              onClick={handleGetStarted}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-semibold"
              data-testid="get-started-btn"
            >
              Get Started
            </Button>
          </nav>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight animate-fadeIn">
              Build. Innovate.
              <span className="gradient-text"> Win Together.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto animate-fadeIn">
              Join the ultimate hackathon platform where developers, designers, and innovators 
              collaborate to create groundbreaking solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeIn">
              <Button 
                onClick={handleGetStarted}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg rounded-xl font-semibold group"
                data-testid="hero-get-started-btn"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-purple-600 text-purple-400 hover:bg-purple-600/10 px-8 py-6 text-lg rounded-xl font-semibold"
                onClick={() => document.getElementById('hackathons').scrollIntoView({ behavior: 'smooth' })}
                data-testid="explore-hackathons-btn"
              >
                Explore Hackathons
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Trophy, label: 'Active Hackathons', value: hackathons.length },
              { icon: Users, label: 'Innovators', value: '10K+' },
              { icon: Code, label: 'Projects Built', value: '5K+' },
              { icon: Rocket, label: 'Winners Funded', value: '500+' },
            ].map((stat, idx) => (
              <Card key={idx} className="glass-effect p-6 hover-lift" data-testid={`stat-card-${idx}`}>
                <stat.icon className="w-8 h-8 text-purple-500 mb-2" />
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Hackathons Section */}
      <div id="hackathons" className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Discover <span className="gradient-text">Hackathons</span></h2>
          <p className="text-gray-400 text-lg">Find the perfect challenge to showcase your skills</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-gray-900/50 border-gray-800 text-white h-12 rounded-xl"
              data-testid="search-input"
            />
          </div>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="bg-gray-900/50 border border-gray-800 text-white px-6 py-3 rounded-xl h-12 cursor-pointer"
            data-testid="location-filter"
          >
            <option value="">All Locations</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* Hackathons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHackathons.map((hackathon) => (
            <Card 
              key={hackathon.id} 
              className="glass-effect hover-lift overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/hackathon/${hackathon.id}`)}
              data-testid={`hackathon-card-${hackathon.id}`}
            >
              {/* Cover Image */}
              <div className="h-48 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center">
                {hackathon.cover_image ? (
                  <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover" />
                ) : (
                  <Code className="w-16 h-16 text-purple-500" />
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    {hackathon.title}
                  </h3>
                  <Badge className="status-badge status-upcoming">Live</Badge>
                </div>

                <p className="text-gray-400 text-sm line-clamp-2">{hackathon.description}</p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="capitalize">{hackathon.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(hackathon.event_start).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Team: {hackathon.min_team_size}-{hackathon.max_team_size} members</span>
                  </div>
                </div>

                {hackathon.prizes.length > 0 && (
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-purple-400 font-semibold">
                        {hackathon.prizes[0].amount || 'Exciting Prizes'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredHackathons.length === 0 && (
          <div className="text-center py-20">
            <Code className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No hackathons found</p>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-b from-transparent to-purple-900/10 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why <span className="gradient-text">Hackov8</span>?</h2>
            <p className="text-gray-400 text-lg">Everything you need to succeed in hackathons</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Form teams easily with invite codes and collaborate seamlessly',
              },
              {
                icon: Trophy,
                title: 'Live Judging',
                description: 'Get real-time feedback from expert judges with transparent scoring',
              },
              {
                icon: Rocket,
                title: 'Project Showcase',
                description: 'Submit your projects with GitHub links, videos, and live demos',
              },
            ].map((feature, idx) => (
              <Card key={idx} className="card-gradient p-8 hover-lift" data-testid={`feature-card-${idx}`}>
                <feature.icon className="w-12 h-12 text-purple-500 mb-4" />
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="glass-effect rounded-3xl p-12 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Building?</h2>
          <p className="text-gray-400 text-lg mb-8">
            Join thousands of developers and innovators on Hackov8
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-6 text-lg rounded-xl font-semibold"
            data-testid="cta-get-started-btn"
          >
            Get Started Now
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-8">
        <div className="container mx-auto px-6 text-center text-gray-500">
          <p>© 2025 Hackov8. Streamline how hackathons are hosted, managed, and judged.</p>
        </div>
      </footer>
    </div>
  );
}
