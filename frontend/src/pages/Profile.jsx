import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Save, Github, Linkedin, Camera, Link as LinkIcon, Copy, CheckCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

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
      if (user.profile_photo) {
        setProfilePhotoPreview(`${process.env.REACT_APP_BACKEND_URL}${user.profile_photo}`);
      }
    } catch (error) {
      toast.error('Failed to load profile');
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
