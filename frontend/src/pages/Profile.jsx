import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Rocket, ArrowLeft, Save, Github, Linkedin, Camera, Link as LinkIcon, 
  Copy, CheckCircle, User, Mail, AlertCircle, Plus, Trash2, Edit, 
  Briefcase, GraduationCap, Code, Award, Trophy, X, Globe, Twitter, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { authAPI, userAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Profile() {
  const navigate = useNavigate();
  const currentUser = getUser();
  
  // Basic Info
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [profileSlug, setProfileSlug] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  // Social Links
  const [githubLink, setGithubLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  
  // CV Data
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);
  const [projects, setProjects] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Set Password States
  const [hasPassword, setHasPassword] = useState(true);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingPassword, setSettingPassword] = useState(false);
  
  // Form States for Adding/Editing Items
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data;
      
      // Basic Info
      setName(user.name || '');
      setBio(user.bio || '');
      setCurrentStatus(user.current_status || '');
      setProfileSlug(user.profile_slug || '');
      setEmailVerified(user.email_verified || false);
      setUserEmail(user.email || '');
      setHasPassword(user.password_hash !== null && user.password_hash !== undefined);
      
      // Social Links
      setGithubLink(user.github_link || '');
      setLinkedinLink(user.linkedin_link || '');
      setTwitterLink(user.twitter_link || '');
      setPortfolioLink(user.portfolio_link || '');
      
      // CV Data
      setSkills(user.skills || []);
      setExperience(user.experience || []);
      setEducation(user.education || []);
      setProjects(user.projects || []);
      setAchievements(user.achievements || []);
      setCertifications(user.certifications || []);
      
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
      await axios.post(`${API_URL}/auth/resend-verification`, {
        email: userEmail
      }, {
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

  const handleSetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSettingPassword(true);
    try {
      await axios.post(`${API_URL}/auth/set-password`, {
        password: newPassword
      }, {
        withCredentials: true,
      });
      
      toast.success('Password set successfully! You can now login with email and password.');
      setHasPassword(true);
      setShowSetPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Set password error:', error);
      toast.error(error.response?.data?.detail || 'Failed to set password');
    } finally {
      setSettingPassword(false);
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
      const profileData = {
        name,
        bio,
        current_status: currentStatus,
        github_link: githubLink,
        linkedin_link: linkedinLink,
        twitter_link: twitterLink,
        portfolio_link: portfolioLink,
        skills,
        experience,
        education,
        projects,
        achievements,
        certifications
      };
      
      await userAPI.updateProfile(profileData);
      toast.success('Profile updated successfully!');
      
      // Update local storage
      const user = getUser();
      localStorage.setItem('user', JSON.stringify({ ...user, ...profileData }));
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Skills Management
  const addSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  // Experience Management
  const addExperience = () => {
    setExperience([...experience, { company: '', role: '', start_date: '', end_date: '', description: '' }]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  // Education Management
  const addEducation = () => {
    setEducation([...education, { institution: '', degree: '', field: '', start_date: '', end_date: '', description: '' }]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  // Projects Management
  const addProject = () => {
    setProjects([...projects, { title: '', description: '', tech_stack: '', link: '', github_link: '' }]);
  };

  const updateProject = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  };

  const removeProject = (index) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  // Achievements Management
  const addAchievement = () => {
    setAchievements([...achievements, { title: '', description: '', date: '' }]);
  };

  const updateAchievement = (index, field, value) => {
    const updated = [...achievements];
    updated[index][field] = value;
    setAchievements(updated);
  };

  const removeAchievement = (index) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  // Certifications Management
  const addCertification = () => {
    setCertifications([...certifications, { title: '', issuer: '', date: '', link: '' }]);
  };

  const updateCertification = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };

  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
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

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Edit <span className="gradient-text">Profile</span></h1>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gray-900/50 p-1">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="education">Education</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-6">
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

                {/* Set Password Section - For Google Sign-In Users */}
                {!hasPassword && (
                  <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Password Login</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Set a password to enable email & password login
                        </p>
                      </div>
                      {!showSetPassword && (
                        <Button
                          onClick={() => setShowSetPassword(true)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Set Password
                        </Button>
                      )}
                    </div>
                    
                    {showSetPassword && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">New Password</label>
                          <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-gray-900/50 border-gray-800 text-white"
                            placeholder="At least 8 characters"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="bg-gray-900/50 border-gray-800 text-white"
                            placeholder="Re-enter password"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSetPassword}
                            disabled={settingPassword}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                          >
                            {settingPassword ? 'Setting...' : 'Confirm'}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowSetPassword(false);
                              setNewPassword('');
                              setConfirmPassword('');
                            }}
                            size="sm"
                            variant="outline"
                            className="border-gray-700 text-gray-400"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                    Share this URL to showcase your professional CV
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Current Status</label>
                  <Input
                    type="text"
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder="e.g., Software Engineer at Google, Student at MIT"
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

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Social Links</h3>
                  
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <Twitter className="w-4 h-4 inline mr-2" />
                      Twitter/X Profile
                    </label>
                    <Input
                      type="url"
                      value={twitterLink}
                      onChange={(e) => setTwitterLink(e.target.value)}
                      className="bg-gray-900/50 border-gray-800 text-white"
                      placeholder="https://twitter.com/yourusername"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">
                      <Globe className="w-4 h-4 inline mr-2" />
                      Portfolio/Website
                    </label>
                    <Input
                      type="url"
                      value={portfolioLink}
                      onChange={(e) => setPortfolioLink(e.target.value)}
                      className="bg-gray-900/50 border-gray-800 text-white"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            <Card className="glass-effect p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-purple-500" />
                  <h2 className="text-2xl font-bold text-white">Work Experience</h2>
                </div>
                <Button onClick={addExperience} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Experience
                </Button>
              </div>

              {experience.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No experience added yet. Click "Add Experience" to get started.</p>
              ) : (
                <div className="space-y-6">
                  {experience.map((exp, index) => (
                    <Card key={index} className="bg-gray-900/50 p-6 border border-gray-800">
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeExperience(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Company</label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(index, 'company', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="Company name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Role</label>
                          <Input
                            value={exp.role}
                            onChange={(e) => updateExperience(index, 'role', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="Job title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                          <Input
                            type="month"
                            value={exp.start_date}
                            onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">End Date</label>
                          <Input
                            type="month"
                            value={exp.end_date}
                            onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="Leave empty if current"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-400 mb-2">Description</label>
                          <Textarea
                            value={exp.description}
                            onChange={(e) => updateExperience(index, 'description', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white min-h-20"
                            placeholder="Describe your responsibilities and achievements..."
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Education Tab */}
          <TabsContent value="education" className="space-y-4">
            <Card className="glass-effect p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-purple-500" />
                  <h2 className="text-2xl font-bold text-white">Education</h2>
                </div>
                <Button onClick={addEducation} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Education
                </Button>
              </div>

              {education.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No education added yet. Click "Add Education" to get started.</p>
              ) : (
                <div className="space-y-6">
                  {education.map((edu, index) => (
                    <Card key={index} className="bg-gray-900/50 p-6 border border-gray-800">
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEducation(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Institution</label>
                          <Input
                            value={edu.institution}
                            onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="University or school name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Degree</label>
                          <Input
                            value={edu.degree}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="e.g., Bachelor of Science"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Field of Study</label>
                          <Input
                            value={edu.field}
                            onChange={(e) => updateEducation(index, 'field', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Start Year</label>
                            <Input
                              type="month"
                              value={edu.start_date}
                              onChange={(e) => updateEducation(index, 'start_date', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">End Year</label>
                            <Input
                              type="month"
                              value={edu.end_date}
                              onChange={(e) => updateEducation(index, 'end_date', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-400 mb-2">Description (Optional)</label>
                          <Textarea
                            value={edu.description}
                            onChange={(e) => updateEducation(index, 'description', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white min-h-16"
                            placeholder="Relevant coursework, achievements, etc."
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card className="glass-effect p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Code className="w-6 h-6 text-purple-500" />
                  <h2 className="text-2xl font-bold text-white">Projects</h2>
                </div>
                <Button onClick={addProject} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Project
                </Button>
              </div>

              {projects.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No projects added yet. Click "Add Project" to get started.</p>
              ) : (
                <div className="space-y-6">
                  {projects.map((proj, index) => (
                    <Card key={index} className="bg-gray-900/50 p-6 border border-gray-800">
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeProject(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Project Title</label>
                          <Input
                            value={proj.title}
                            onChange={(e) => updateProject(index, 'title', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="Project name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Description</label>
                          <Textarea
                            value={proj.description}
                            onChange={(e) => updateProject(index, 'description', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white min-h-20"
                            placeholder="What did you build and what problem does it solve?"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Tech Stack</label>
                          <Input
                            value={proj.tech_stack}
                            onChange={(e) => updateProject(index, 'tech_stack', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="e.g., React, Node.js, MongoDB, AWS"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Project Link (Optional)</label>
                            <Input
                              type="url"
                              value={proj.link}
                              onChange={(e) => updateProject(index, 'link', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="https://yourproject.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">GitHub Link (Optional)</label>
                            <Input
                              type="url"
                              value={proj.github_link}
                              onChange={(e) => updateProject(index, 'github_link', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="https://github.com/user/repo"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <Card className="glass-effect p-6">
              <div className="flex items-center gap-2 mb-6">
                <Code className="w-6 h-6 text-purple-500" />
                <h2 className="text-2xl font-bold text-white">Skills</h2>
              </div>

              <div className="flex gap-2 mb-6">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Add a skill (e.g., JavaScript, Python, React)"
                />
                <Button onClick={addSkill} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {skills.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No skills added yet. Add your technical and professional skills.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge
                      key={index}
                      className="bg-purple-600/20 text-purple-300 border-purple-600 px-3 py-2 text-sm flex items-center gap-2"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(index)}
                        className="hover:text-red-400 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <Card className="glass-effect p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-purple-500" />
                  <h2 className="text-2xl font-bold text-white">Achievements</h2>
                </div>
                <Button onClick={addAchievement} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Achievement
                </Button>
              </div>

              {achievements.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No achievements added yet. Click "Add Achievement" to get started.</p>
              ) : (
                <div className="space-y-6">
                  {achievements.map((ach, index) => (
                    <Card key={index} className="bg-gray-900/50 p-6 border border-gray-800">
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAchievement(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Title</label>
                            <Input
                              value={ach.title}
                              onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="Achievement title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Date</label>
                            <Input
                              type="month"
                              value={ach.date}
                              onChange={(e) => updateAchievement(index, 'date', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Description</label>
                          <Textarea
                            value={ach.description}
                            onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                            className="bg-gray-800 border-gray-700 text-white min-h-16"
                            placeholder="Describe your achievement..."
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certifications" className="space-y-4">
            <Card className="glass-effect p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-500" />
                  <h2 className="text-2xl font-bold text-white">Certifications</h2>
                </div>
                <Button onClick={addCertification} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>

              {certifications.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No certifications added yet. Click "Add Certification" to get started.</p>
              ) : (
                <div className="space-y-6">
                  {certifications.map((cert, index) => (
                    <Card key={index} className="bg-gray-900/50 p-6 border border-gray-800">
                      <div className="flex justify-end mb-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCertification(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Certification Title</label>
                            <Input
                              value={cert.title}
                              onChange={(e) => updateCertification(index, 'title', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="e.g., AWS Solutions Architect"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Issuing Organization</label>
                            <Input
                              value={cert.issuer}
                              onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="e.g., Amazon Web Services"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Issue Date</label>
                            <Input
                              type="month"
                              value={cert.date}
                              onChange={(e) => updateCertification(index, 'date', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Credential Link (Optional)</label>
                            <Input
                              type="url"
                              value={cert.link}
                              onChange={(e) => updateCertification(index, 'link', e.target.value)}
                              className="bg-gray-800 border-gray-700 text-white"
                              placeholder="https://credential-url.com"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button at Bottom */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white py-6 px-12 text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving All Changes...' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
