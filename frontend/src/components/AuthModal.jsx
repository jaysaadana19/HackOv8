import React, { useState } from 'react';
import { X, Mail, Lock, User, Building, Globe, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import axios from 'axios';
import { setAuth } from '@/lib/auth';
import GoogleSignInButton from './GoogleSignInButton';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Helper function to safely format error messages for display
const formatErrorMessage = (error, defaultMessage) => {
  if (typeof error === 'string') return error;
  
  if (error?.response?.data) {
    const errorData = error.response.data;
    
    // Handle FastAPI validation errors
    if (Array.isArray(errorData.detail)) {
      return errorData.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
    }
    
    // Handle string detail
    if (typeof errorData.detail === 'string') {
      return errorData.detail;
    }
    
    // Handle object detail
    if (typeof errorData.detail === 'object' && errorData.detail.msg) {
      return errorData.detail.msg;
    }
    
    // Handle direct message
    if (errorData.message) {
      return errorData.message;
    }
  }
  
  return error?.message || defaultMessage;
};

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
      console.error('Login error:', error);
      toast.error(formatErrorMessage(error, 'Login failed'));
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
      console.error('Signup error:', error);
      toast.error(formatErrorMessage(error, 'Signup failed'));
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

              <div className="text-center text-sm text-gray-500 mt-6">
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

    </div>
  );
}