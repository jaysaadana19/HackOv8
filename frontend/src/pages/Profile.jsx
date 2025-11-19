import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Save, Github, Linkedin, Camera, Link as LinkIcon, Copy, CheckCircle, User, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { authAPI, userAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = getUser();
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profileSlug, setProfileSlug] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data;
      setName(user.name || '');
      setBio(user.bio || '');
      setGithubLink(user.github_link || '');
      setLinkedinLink(user.linkedin_link || '');
      setProfileSlug(user.profile_slug || '');
      setEmailVerified(user.email_verified || false);
      setUserEmail(user.email || '');
      if (user.profile_photo) {
        setProfilePhotoPreview(`${process.env.REACT_APP_BACKEND_URL}${user.profile_photo}`);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await axios.post(`${API_URL}/auth/resend-verification`, {}, {
        withCredentials: true,
      });
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto) {
      toast.error('Please select a photo first');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', profilePhoto);

      const response = await axios.post(`${API_URL}/users/profile-photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      toast.success('Profile photo uploaded successfully!');
      setProfilePhotoPreview(`${process.env.REACT_APP_BACKEND_URL}${response.data.photo_url}`);
      setProfilePhoto(null);
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleGenerateSlug = async () => {
    setGeneratingSlug(true);
    try {
      const response = await axios.post(`${API_URL}/users/generate-slug`, {}, {
        withCredentials: true,
      });

      setProfileSlug(response.data.slug);
      toast.success(response.data.message);
    } catch (error) {
      console.error('Slug generation error:', error);
      toast.error('Failed to generate profile slug');
    } finally {
      setGeneratingSlug(false);
    }
  };

  const copyProfileUrl = () => {
    const profileUrl = `${window.location.origin}/profile/${profileSlug}`;
    navigator.clipboard.writeText(profileUrl);
    setSlugCopied(true);
    toast.success('Profile URL copied to clipboard!');
    setTimeout(() => setSlugCopied(false), 2000);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile({ name, bio, github_link: githubLink, linkedin_link: linkedinLink });
      toast.success('Profile updated successfully!');
      
      // Update local storage
      const user = getUser();
      localStorage.setItem('user', JSON.stringify({ ...user, name, bio, github_link: githubLink, linkedin_link: linkedinLink }));
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center space-x-2">
            <Rocket className="w-6 h-6 text-purple-500" />
            <span className="text-xl font-bold gradient-text">Hackov8</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8">Edit <span className="gradient-text">Profile</span></h1>

        <Card className="glass-effect p-8">
          <div className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-purple-600">
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-gray-500" />
                  )}
                </div>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-2 cursor-pointer hover:bg-purple-700 transition">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>
              {profilePhoto && (
                <Button
                  onClick={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                </Button>
              )}
            </div>

            {/* Email Verification Status */}
            <div className={`p-4 rounded-lg border ${emailVerified ? 'bg-green-900/20 border-green-800' : 'bg-yellow-900/20 border-yellow-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className={`w-5 h-5 ${emailVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                  <div>
                    <p className="font-semibold text-white">{userEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {emailVerified ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-400">Email Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-yellow-400">Email Not Verified</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {!emailVerified && (
                  <Button
                    onClick={handleResendVerification}
                    disabled={sendingVerification}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {sendingVerification ? 'Sending...' : 'Resend Verification'}
                  </Button>
                )}
              </div>
              {!emailVerified && (
                <p className="text-xs text-gray-400 mt-3">
                  Please verify your email to access all platform features. Check your inbox for the verification link.
                </p>
              )}
            </div>

            {/* Public Profile Slug Section */}
            <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 p-4 rounded-lg border border-purple-800">
              <label className="block text-sm font-semibold text-gray-400 mb-2 flex items-center">
                <LinkIcon className="w-4 h-4 inline mr-2" />
                Public Profile URL
              </label>
              {profileSlug ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={`${window.location.origin}/profile/${profileSlug}`}
                    readOnly
                    className="bg-gray-900/50 border-gray-800 text-white"
                  />
                  <Button
                    onClick={copyProfileUrl}
                    size="icon"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {slugCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateSlug}
                  disabled={generatingSlug}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generatingSlug ? 'Generating...' : 'Generate Public Profile URL'}
                </Button>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Share this URL to showcase your hackathon participation history
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white min-h-24"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                <Github className="w-4 h-4 inline mr-2" />
                GitHub Profile
              </label>
              <Input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                <Linkedin className="w-4 h-4 inline mr-2" />
                LinkedIn Profile
              </label>
              <Input
                type="url"
                value={linkedinLink}
                onChange={(e) => setLinkedinLink(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
