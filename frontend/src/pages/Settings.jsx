import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, User, Mail, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { getUser, isAuthenticated } from '@/lib/auth';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Settings() {
  const navigate = useNavigate();
  const user = getUser();
  const [loading, setLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/');
      return;
    }
    // Check email verification status
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailVerified(response.data.email_verified || false);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      await axios.post(
        `${API_URL}/auth/change-password`,
        null,
        {
          params: {
            old_password: oldPassword,
            new_password: newPassword
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      const token = localStorage.getItem('session_token');
      await axios.post(
        `${API_URL}/auth/resend-verification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Navbar */}
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card className="glass-effect p-6 border border-purple-800/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Profile Information</h2>
                <p className="text-gray-400 text-sm">Your account details</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Name</Label>
                <p className="text-white font-semibold text-lg">{user?.name}</p>
              </div>
              <div>
                <Label className="text-gray-400">Email</Label>
                <div className="flex items-center gap-3">
                  <p className="text-white font-semibold text-lg">{user?.email}</p>
                  {emailVerified ? (
                    <div className="flex items-center gap-1 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-orange-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Not Verified</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleResendVerification}
                        disabled={sendingVerification}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        {sendingVerification ? 'Sending...' : 'Verify Email'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-gray-400">Role</Label>
                <p className="text-white font-semibold text-lg capitalize">{user?.role}</p>
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="glass-effect p-6 border border-purple-800/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Change Password</h2>
                <p className="text-gray-400 text-sm">Update your password to keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label className="text-gray-400 mb-2 block">Current Password</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Security Tips Card */}
          <Card className="glass-effect p-6 border border-teal-500/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-500" />
              Security Tips
            </h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>Use a strong password with at least 8 characters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>Include numbers, symbols, and mixed case letters</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>Don't reuse passwords from other accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <span>Verify your email to receive important security updates</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
