import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { setAuth } from '@/lib/auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google authentication failed');
        navigate('/');
        return;
      }

      if (!code) {
        toast.error('No authorization code received');
        navigate('/');
        return;
      }

      try {
        // Send code to backend for processing
        const response = await axios.post(`${API_URL}/auth/google/callback`, {
          code,
          redirect_uri: `${window.location.origin}/auth/google/callback`
        });

        const { session_token, ...user } = response.data;
        setAuth(session_token, user);
        
        toast.success(`Welcome, ${user.name}!`);
        navigate('/dashboard');
      } catch (error) {
        console.error('Google auth error:', error);
        toast.error(error.response?.data?.detail || 'Authentication failed');
        navigate('/');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="loading-spinner mb-4"></div>
        <p className="text-gray-600">Authenticating with Google...</p>
      </div>
    </div>
  );
}
