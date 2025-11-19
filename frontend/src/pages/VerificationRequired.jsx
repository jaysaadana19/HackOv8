import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { getUser } from '@/lib/auth';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function VerificationRequired() {
  const navigate = useNavigate();
  const user = getUser();
  const [sending, setSending] = useState(false);

  const handleResendVerification = async () => {
    setSending(true);
    try {
      await axios.post(`${API_URL}/auth/resend-verification`, {}, {
        withCredentials: true,
      });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Navigation */}
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Rocket className="w-6 h-6 text-purple-500" />
              <span className="text-xl font-bold gradient-text">Hackov8</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-2xl">
        <Card className="glass-effect p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">
            <span className="gradient-text">Email Verification Required</span>
          </h1>

          <p className="text-gray-300 mb-6">
            To access the dashboard and participate in hackathons, you need to verify your email address.
          </p>

          <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-2 justify-center text-gray-300">
              <Mail className="w-5 h-5 text-purple-500" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="text-left bg-gray-900/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">What to do:</h3>
              <ol className="list-decimal list-inside text-gray-400 space-y-2 text-sm">
                <li>Check your email inbox for the verification email</li>
                <li>Look for an email from "Hackov8 Mail Verification"</li>
                <li>Click the "Verify Email Address" button in the email</li>
                <li>You'll be redirected back and can access the dashboard</li>
              </ol>
            </div>

            <div className="text-left bg-gray-900/50 p-4 rounded-lg">
              <h3 className="font-semibold text-white mb-2">Didn't receive the email?</h3>
              <ul className="text-gray-400 space-y-1 text-sm">
                <li>• Check your spam/junk folder</li>
                <li>• Wait a few minutes for the email to arrive</li>
                <li>• Click the button below to resend the verification email</li>
              </ul>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleResendVerification}
              disabled={sending}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {sending ? 'Sending...' : 'Resend Verification Email'}
            </Button>

            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Go to Profile
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="w-full text-gray-400 hover:text-white"
            >
              Back to Home
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Need help? Contact us at{' '}
            <a href="mailto:hackov8@gmail.com" className="text-purple-500 hover:text-purple-400">
              hackov8@gmail.com
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
