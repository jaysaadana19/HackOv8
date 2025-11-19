import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Rocket, CheckCircle, XCircle, Mail, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('No verification token provided');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/verify-email?token=${token}`);
      
      // If verification successful and we got a session token, save it
      if (response.data.session_token) {
        localStorage.setItem('session_token', response.data.session_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set cookie for backend
        document.cookie = `session_token=${response.data.session_token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=none`;
      }
      
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      toast.success('Email verified! Redirecting...');
      
      // Redirect based on user role after 2 seconds
      setTimeout(() => {
        const user = response.data.user;
        const roleRoutes = {
          'admin': '/admin',
          'organizer': '/organizer',
          'judge': '/judge',
          'participant': '/dashboard'
        };
        
        const redirectPath = roleRoutes[user?.role] || '/dashboard';
        window.location.href = redirectPath;
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Verification failed');
      toast.error('Email verification failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Rocket className="w-10 h-10 text-purple-500" />
            <span className="text-3xl font-bold gradient-text">Hackov8</span>
          </div>
          <p className="text-gray-400">Email Verification</p>
        </div>

        <Card className="glass-effect p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <Mail className="w-20 h-20 text-purple-500" />
                  <Loader className="w-8 h-8 text-purple-400 absolute bottom-0 right-0 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Verifying Your Email</h2>
              <p className="text-gray-400">Please wait while we verify your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Email Verified! 🎉</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting you to dashboard in 2 seconds...</p>
              <Button
                onClick={() => navigate('/dashboard')}
                className="mt-4 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Go to Dashboard Now
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Verification Failed</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          )}
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help? Contact support at{' '}
          <a href="mailto:hackov8@gmail.com" className="text-purple-500 hover:text-purple-400">
            hackov8@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
