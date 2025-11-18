import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Trophy, Users, Code, Calendar, MapPin, ArrowRight, Search, Sparkles, Zap, Shield, TrendingUp, Star, CheckCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, authAPI } from '@/lib/api';
import { isAuthenticated, setAuth } from '@/lib/auth';
import AuthModal from '@/components/AuthModal';
import Footer from '@/components/Footer';
import { getHackathonBanner } from '@/lib/bannerImages';

export default function LandingEnhanced() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [counts, setCounts] = useState({ hackathons: 0, participants: 0, projects: 0 });
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const heroRef = useRef(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    // Handle GitHub OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const githubAuth = urlParams.get('github_auth');
    const token = urlParams.get('token');
    
    if (githubAuth === 'success' && token) {
      handleGitHubCallback(token);
      return;
    }

    const fragment = window.location.hash;
    if (fragment && fragment.includes('session_id=')) {
      handleAuthCallback(fragment);
      return;
    }

    if (isAuthenticated()) {
      navigate('/dashboard');
      return;
    }

    fetchHackathons();
    animateCounts();
  }, []);

  const handleGitHubCallback = async (token) => {
    setLoading(true);
    
    if (!token) {
      toast.error('GitHub authentication failed - no token received');
      window.history.replaceState({}, document.title, '/');
      setLoading(false);
      return;
    }
    
    try {
      // Temporarily set token to make authenticated request
      localStorage.setItem('session_token', token);
      
      // Get user info using the session token
      const response = await authAPI.getCurrentUser();
      const user = response.data;
      
      // Save user info
      localStorage.setItem('user', JSON.stringify(user));
      
      window.history.replaceState({}, document.title, '/dashboard');
      
      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (error) {
      console.error('GitHub auth error:', error);
      toast.error('GitHub authentication failed');
      localStorage.removeItem('session_token');
      window.history.replaceState({}, document.title, '/');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGitHubError = (errorType) => {
    const errorMessages = {
      'access_denied': 'You denied access to GitHub',
      'config_error': 'GitHub OAuth is not configured properly',
      'no_code': 'GitHub authorization code is missing',
      'token_exchange_failed': 'Failed to exchange code for access token',
      'no_access_token': 'No access token received from GitHub',
      'user_info_failed': 'Failed to retrieve user information from GitHub',
      'invalid_user_data': 'Invalid user data received from GitHub',
      'server_error': 'An error occurred during GitHub authentication',
      'unknown': 'GitHub authentication failed'
    };
    
    const message = errorMessages[errorType] || errorMessages['unknown'];
    toast.error(message);
    window.history.replaceState({}, document.title, '/');
    setLoading(false);
  };

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
      // Get published hackathons, featured first, limit to 5
      const response = await hackathonAPI.getAll({ status: 'published' });
      // Filter out completed hackathons and limit to 5
      const activeHackathons = response.data
        .filter(h => h.status !== 'completed')
        .slice(0, 5);
      setHackathons(activeHackathons);
    } catch (error) {
      console.error('Failed to fetch hackathons', error);
    }
  };

  const animateCounts = () => {
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setCounts({
        hackathons: Math.floor(progress * 150),
        participants: Math.floor(progress * 10000),
        projects: Math.floor(progress * 5000)
      });

      if (currentStep >= steps) clearInterval(interval);
    }, increment);
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
    <div className="min-h-screen bg-[#0a0a0b] overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen animated-bg" ref={heroRef}>
        {/* Animated Particles */}
        <div className="particles pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 15}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 sm:px-6 py-6 sm:py-8 z-10">
          {/* Navbar */}
          <nav className="flex items-center justify-between mb-12 sm:mb-20 animate-fadeIn" data-testid="landing-navbar">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center glow-purple">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold gradient-text">Hackov8</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="text-gray-600 hover:text-teal-600 p-2"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/50 transition-all text-sm sm:text-base"
                data-testid="get-started-btn"
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 py-10 sm:py-20">
            <div className="animate-fadeIn">
              <Badge className="status-badge status-upcoming mb-4 sm:mb-6 text-xs sm:text-sm px-4 sm:px-6 py-1.5 sm:py-2">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                🎉 Now Live - Join 10K+ Innovators
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-tight animate-fadeIn px-4">
              Build. Innovate.
              <br />
              <span className="gradient-text">Win Together.</span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto animate-fadeIn leading-relaxed px-4">
              The ultimate platform where <span className="text-purple-400 font-semibold">developers</span>, 
              <span className="text-pink-400 font-semibold"> designers</span>, and 
              <span className="text-purple-400 font-semibold"> innovators</span> collaborate to create groundbreaking solutions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center animate-fadeIn pt-6 sm:pt-8 px-4">
              <Button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg rounded-2xl font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all group"
                data-testid="hero-get-started-btn"
              >
                Start Your Journey
                <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-purple-500 text-purple-300 hover:bg-purple-500/10 px-10 py-7 text-lg rounded-2xl font-semibold backdrop-blur-sm"
                onClick={() => document.getElementById('hackathons')?.scrollIntoView({ behavior: 'smooth' })}
                data-testid="explore-hackathons-btn"
              >
                Explore Hackathons
              </Button>
            </div>
          </div>

          {/* Animated Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto mt-12 sm:mt-20 animate-scaleIn">
            {[
              { icon: Trophy, label: 'Total Hackathons', value: counts.hackathons, suffix: '+', color: 'from-yellow-500 to-orange-500' },
              { icon: Users, label: 'Innovators', value: counts.participants, suffix: '+', color: 'from-purple-500 to-pink-500' },
              { icon: Code, label: 'Projects Built', value: counts.projects, suffix: '+', color: 'from-blue-500 to-cyan-500' },
              { icon: Rocket, label: 'Success Rate', value: 98, suffix: '%', color: 'from-green-500 to-emerald-500' },
            ].map((stat, idx) => (
              <Card key={idx} className="glass-effect p-4 sm:p-8 hover-lift text-center" data-testid={`stat-card-${idx}`}>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="text-2xl sm:text-4xl font-bold gradient-text count-up">{stat.value.toLocaleString()}{stat.suffix}</div>
                <div className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2 font-medium">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 px-4">
              Why Choose <span className="gradient-text">Hackov8</span>?
            </h2>
            <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto px-4">
              Everything you need to succeed in hackathons, all in one powerful platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10 max-w-7xl mx-auto">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Real-time updates, instant notifications, and seamless collaboration',
                gradient: 'from-yellow-500 to-orange-500'
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Enterprise-grade security with end-to-end encryption',
                gradient: 'from-green-500 to-emerald-500'
              },
              {
                icon: TrendingUp,
                title: 'Scale Effortlessly',
                description: 'From small meetups to global hackathons with thousands of participants',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Built-in tools for seamless team formation and project management',
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: Trophy,
                title: 'Fair Judging',
                description: 'Custom rubrics, transparent scoring, and detailed feedback',
                gradient: 'from-orange-500 to-red-500'
              },
              {
                icon: Rocket,
                title: 'Easy Management',
                description: 'Comprehensive dashboard for organizers to manage everything',
                gradient: 'from-indigo-500 to-purple-500'
              },
            ].map((feature, idx) => (
              <Card key={idx} className="card-gradient p-6 sm:p-8 hover-lift group" data-testid={`feature-card-${idx}`}>
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 sm:mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-white">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Hackathons Section */}
      <div id="hackathons" className="py-16 sm:py-24 md:py-32 container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 px-4">
            Discover <span className="gradient-text">Hackathons</span>
          </h2>
          <p className="text-gray-400 text-base sm:text-xl px-4">Find the perfect challenge to showcase your skills</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-12 sm:mb-16 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500" />
            <Input
              type="text"
              placeholder="Search hackathons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 bg-gray-900/50 border-gray-800 text-white h-14 rounded-2xl text-lg shadow-lg"
              data-testid="search-input"
            />
          </div>
          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="bg-gray-900/50 border border-gray-800 text-white px-8 py-4 rounded-2xl h-14 cursor-pointer text-lg shadow-lg"
            data-testid="location-filter"
          >
            <option value="">All Locations</option>
            <option value="online">🌐 Online</option>
            <option value="offline">📍 Offline</option>
            <option value="hybrid">🔄 Hybrid</option>
          </select>
        </div>

        {/* Hackathons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHackathons.map((hackathon) => (
            <Card 
              key={hackathon.id} 
              className="glass-effect hover-lift overflow-hidden cursor-pointer group"
              onClick={() => navigate(`/hackathon/${hackathon.slug}`)}
              data-testid={`hackathon-card-${hackathon.id}`}
            >
              <div className="h-56 bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center relative overflow-hidden">
                <img 
                  src={getHackathonBanner(hackathon)} 
                  alt={hackathon.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    console.error('Failed to load image:', getHackathonBanner(hackathon));
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {hackathon.featured && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full flex items-center gap-2 font-bold text-sm shadow-lg">
                    <Star className="w-4 h-4 fill-black" />
                    Featured
                  </div>
                )}
              </div>

              <div className="p-8 space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors leading-tight">
                    {hackathon.title}
                  </h3>
                  <Badge className="status-badge status-live ml-2">Live</Badge>
                </div>

                <p className="text-gray-400 line-clamp-2 leading-relaxed">{hackathon.description}</p>

                <div className="space-y-3 text-sm text-gray-500">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    <span className="capitalize font-medium">{hackathon.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">{new Date(hackathon.event_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Team: {hackathon.min_team_size}-{hackathon.max_team_size} members</span>
                  </div>
                </div>

                {hackathon.prizes.length > 0 && (
                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="text-purple-400 font-bold text-lg">
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
            <Code className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <p className="text-gray-500 text-xl">No hackathons found</p>
          </div>
        )}
      </div>

      {/* Testimonials Section */}
      <div className="py-32 bg-gradient-to-b from-purple-900/10 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl sm:text-6xl font-bold mb-6">
              Loved by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="text-gray-400 text-xl">See what our community says about Hackov8</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                name: 'Sarah Chen',
                role: 'Full Stack Developer',
                company: 'TechCorp',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
                text: 'Hackov8 made organizing our company hackathon incredibly smooth. The judging system is transparent and fair!'
              },
              {
                name: 'Marcus Johnson',
                role: 'Startup Founder',
                company: 'InnovateLabs',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
                text: 'Found my co-founder through a Hackov8 event! The platform brings together the best talent from around the world.'
              },
              {
                name: 'Priya Sharma',
                role: 'UI/UX Designer',
                company: 'DesignHub',
                image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
                text: 'The team collaboration features are amazing. We built our winning project using Hackov8s built-in tools.'
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="glass-effect p-8 hover-lift">
                <div className="flex items-center gap-4 mb-6">
                  <img src={testimonial.image} alt={testimonial.name} className="w-16 h-16 rounded-full ring-2 ring-purple-500" />
                  <div>
                    <h4 className="font-bold text-white text-lg">{testimonial.name}</h4>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                    <p className="text-xs text-purple-400">{testimonial.company}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-300 leading-relaxed">{testimonial.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-32 container mx-auto px-6">
        <div className="glass-effect rounded-3xl p-16 text-center max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20"></div>
          <div className="relative z-10">
            <h2 className="text-5xl font-bold mb-6">Ready to Start Building?</h2>
            <p className="text-gray-300 text-xl mb-10 leading-relaxed">
              Join thousands of developers and innovators creating the future on Hackov8
            </p>
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-7 text-xl rounded-2xl font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all"
              data-testid="cta-get-started-btn"
            >
              <Sparkles className="w-6 h-6 mr-3" />
              Get Started Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
