import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Building, Globe, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';
import { setAuth } from '@/lib/auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function AuthModal({ onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState('participant');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');

  // Google OAuth state
  const [showGoogleRoleSelection, setShowGoogleRoleSelection] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [googleRole, setGoogleRole] = useState('participant');
  const [googleCompanyName, setGoogleCompanyName] = useState('');
  const [googleCompanyWebsite, setGoogleCompanyWebsite] = useState('');

  useEffect(() => {
    // Initialize Google Sign In using OAuth2 popup method
    const initializeGoogle = () => {
      console.log('Initializing Google OAuth2 popup...', {
        google: typeof window.google,
        accounts: typeof window.google?.accounts,
        oauth2: typeof window.google?.accounts?.oauth2,
        clientId: GOOGLE_CLIENT_ID ? 'Found' : 'Missing'
      });
      
      if (window.google && window.google.accounts && window.google.accounts.oauth2 && GOOGLE_CLIENT_ID) {
        console.log('Google OAuth2 services available');
        
        // Initialize OAuth2 client for popup
        window.googleOAuthClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: handleGoogleTokenCallback,
        });
        
        console.log('Google OAuth2 popup client initialized');
      } else {
        if (!GOOGLE_CLIENT_ID) {
          console.error('Google Client ID not found in environment variables');
        } else {
          console.log('Google OAuth2 services not loaded yet, retrying...');
          setTimeout(initializeGoogle, 1000);
        }
      }
    };
    
    // Start initialization after a short delay
    setTimeout(initializeGoogle, 500);
  }, []);

  const handleGoogleCallback = async (response) => {
    try {
      // Decode JWT token to get user info
      const userInfo = JSON.parse(atob(response.credential.split('.')[1]));
      
      // Check if user already exists
      const checkResponse = await axios.get(`${API_URL}/users/check-email?email=${userInfo.email}`);
      
      if (checkResponse.data.exists) {
        // User exists, proceed with login
        await handleGoogleLogin(response.credential);
      } else {
        // New user, show role selection
        setGoogleUserData({
          credential: response.credential,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        });
        setShowGoogleRoleSelection(true);
      }
    } catch (error) {
      console.error('Google callback error:', error);
      toast.error('Google sign in failed');
    }
  };

  const handleGoogleLogin = async (credential) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/google/callback`, {
        credential: credential,
      });

      const { session_token, ...user } = response.data;
      setAuth(session_token, user);
      
      toast.success(`Welcome back, ${user.name}!`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!googleUserData) return;
    
    if (googleRole === 'organizer' && !googleCompanyName) {
      toast.error('Company name is required for organizers');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/google/callback`, {
        credential: googleUserData.credential,
        role: googleRole,
        company_name: googleRole === 'organizer' ? googleCompanyName : undefined,
        company_website: googleRole === 'organizer' ? googleCompanyWebsite : undefined,
      });

      const { session_token, ...user } = response.data;
      setAuth(session_token, user);
      
      toast.success(`Welcome to Hackov8, ${user.name}!`);
      setShowGoogleRoleSelection(false);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    console.log('Google Sign In button clicked');
    
    if (window.google && window.google.accounts && window.google.accounts.id) {
      console.log('Google Identity Services available, prompting...');
      try {
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Error prompting Google Sign In:', error);
        toast.error('Google Sign In failed to start');
      }
    } else {
      console.error('Google Identity Services not available');
      console.log('window.google:', typeof window.google);
      console.log('window.google.accounts:', typeof window.google?.accounts);
      toast.error('Google Sign In is not available. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: loginEmail,
        password: loginPassword,
      });

      const { session_token, ...user } = response.data;
      setAuth(session_token, user);
      
      toast.success(`Welcome back, ${user.name}!`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (signupRole === 'organizer' && !companyName) {
      toast.error('Company name is required for organizers');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        email: signupEmail,
        password: signupPassword,
        name: signupName,
        role: signupRole,
        company_name: signupRole === 'organizer' ? companyName : undefined,
        company_website: signupRole === 'organizer' ? companyWebsite : undefined,
      });

      const { session_token, ...user } = response.data;
      setAuth(session_token, user);
      
      toast.success(`Welcome to Hackov8, ${user.name}!`);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white flex-shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h2 className="text-3xl font-bold">Hackov8</h2>
          </div>
          <p className="text-teal-100 text-sm">Join the future of hackathons</p>
        </div>

        {/* Tabs - Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-xl flex-shrink-0">
              <TabsTrigger 
                value="login" 
                className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white transition-all"
                data-testid="login-tab"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white transition-all"
                data-testid="signup-tab"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-500" />
                    Email Address
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-gray-700 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-teal-500" />
                    Password
                  </Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full h-12 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>

              <div className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <button 
                  onClick={() => setActiveTab('signup')}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Sign up now
                </button>
              </div>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-gray-700 font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-500" />
                    Full Name
                  </Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                    className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-500" />
                    Email Address
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-gray-700 font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-teal-500" />
                    Password
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl transition-all"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">I want to join as</Label>
                  <RadioGroup value={signupRole} onValueChange={setSignupRole} className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-all cursor-pointer">
                      <RadioGroupItem value="participant" id="participant" />
                      <Label htmlFor="participant" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900 text-sm">Participant</div>
                        <div className="text-xs text-gray-500">Join hackathons and compete</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-all cursor-pointer">
                      <RadioGroupItem value="organizer" id="organizer" />
                      <Label htmlFor="organizer" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900 text-sm">Organizer</div>
                        <div className="text-xs text-gray-500">Host and manage hackathons</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-all cursor-pointer">
                      <RadioGroupItem value="judge" id="judge" />
                      <Label htmlFor="judge" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900 text-sm">Judge</div>
                        <div className="text-xs text-gray-500">Evaluate hackathon submissions</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {signupRole === 'organizer' && (
                  <div className="space-y-3 p-3 bg-teal-50 rounded-xl border-2 border-teal-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="company-name" className="text-gray-700 font-medium flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-teal-500" />
                        Company Name
                      </Label>
                      <Input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your Company"
                        className="h-10 bg-white border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="company-website" className="text-gray-700 font-medium flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-teal-500" />
                        Website (Optional)
                      </Label>
                      <Input
                        id="company-website"
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="h-10 bg-white border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or continue with</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="w-full h-11 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-semibold transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign up with Google
              </Button>

              <div className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{' '}
                <button 
                  onClick={() => setActiveTab('login')}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  Login here
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 pt-2 flex-shrink-0 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Google Role Selection Modal */}
      {showGoogleRoleSelection && googleUserData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] flex flex-col overflow-hidden">
            <div className="relative bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white flex-shrink-0">
              <button 
                onClick={() => setShowGoogleRoleSelection(false)} 
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              </div>
              <p className="text-teal-100 text-sm">Choose your role on Hackov8</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                {googleUserData.picture && (
                  <img 
                    src={googleUserData.picture} 
                    alt={googleUserData.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">{googleUserData.name}</p>
                  <p className="text-sm text-gray-500">{googleUserData.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">I want to join as</Label>
                  <RadioGroup value={googleRole} onValueChange={setGoogleRole} className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-all cursor-pointer">
                      <RadioGroupItem value="participant" id="google-participant" />
                      <Label htmlFor="google-participant" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900 text-sm">Participant</div>
                        <div className="text-xs text-gray-500">Join hackathons and compete</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-all cursor-pointer">
                      <RadioGroupItem value="organizer" id="google-organizer" />
                      <Label htmlFor="google-organizer" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900 text-sm">Organizer</div>
                        <div className="text-xs text-gray-500">Host and manage hackathons</div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-xl hover:border-teal-500 transition-all cursor-pointer">
                      <RadioGroupItem value="judge" id="google-judge" />
                      <Label htmlFor="google-judge" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900 text-sm">Judge</div>
                        <div className="text-xs text-gray-500">Evaluate hackathon submissions</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {googleRole === 'organizer' && (
                  <div className="space-y-3 p-3 bg-teal-50 rounded-xl border-2 border-teal-200">
                    <div className="space-y-1.5">
                      <Label htmlFor="google-company-name" className="text-gray-700 font-medium flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-teal-500" />
                        Company Name
                      </Label>
                      <Input
                        id="google-company-name"
                        type="text"
                        value={googleCompanyName}
                        onChange={(e) => setGoogleCompanyName(e.target.value)}
                        placeholder="Your Company"
                        className="h-10 bg-white border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                        disabled={loading}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="google-company-website" className="text-gray-700 font-medium flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-teal-500" />
                        Website (Optional)
                      </Label>
                      <Input
                        id="google-company-website"
                        type="url"
                        value={googleCompanyWebsite}
                        onChange={(e) => setGoogleCompanyWebsite(e.target.value)}
                        placeholder="https://yourcompany.com"
                        className="h-10 bg-white border-2 border-teal-200 focus:border-teal-500 rounded-lg"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}