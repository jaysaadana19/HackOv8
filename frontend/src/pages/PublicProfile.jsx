import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Calendar, MapPin, Github, Linkedin, User, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function PublicProfile() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicProfile();
  }, [slug]);

  const fetchPublicProfile = async () => {
    try {
      console.log('Fetching profile for slug:', slug);
      const response = await axios.get(`${API_URL}/profile/${slug}`);
      console.log('Profile data received:', response.data);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', error.response?.data);
      
      if (error.response?.status === 404) {
        toast.error('Profile not found. The user may not have created a public profile yet.');
      } else {
        toast.error('Failed to load profile. Please try again.');
      }
      
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Navigation */}
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
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

      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Profile Header */}
        <Card className="glass-effect p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Photo */}
            <div className="w-32 h-32 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-purple-600 flex-shrink-0">
              {profile.profile_photo ? (
                <img 
                  src={`${process.env.REACT_APP_BACKEND_URL}${profile.profile_photo}`} 
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-gray-500" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">{profile.name}</span>
              </h1>
              <Badge className="mb-4 bg-purple-600 text-white">{profile.role}</Badge>
              
              {profile.bio && (
                <p className="text-gray-300 mb-4">{profile.bio}</p>
              )}

              {/* Social Links */}
              <div className="flex gap-3 justify-center md:justify-start">
                {profile.github_link && (
                  <a 
                    href={profile.github_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition text-white"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {profile.linkedin_link && (
                  <a 
                    href={profile.linkedin_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition text-white"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Hackathon Participation Section */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-3xl font-bold">
              Hackathon <span className="gradient-text">Participation</span>
            </h2>
          </div>

          {profile.participated_hackathons && profile.participated_hackathons.length > 0 ? (
            <div className="grid gap-4">
              {profile.participated_hackathons.map((hackathon) => (
                <Card key={hackathon.id} className="glass-effect p-6 hover:border-purple-500 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{hackathon.name}</h3>
                      
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                        {hackathon.start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(hackathon.start_date).toLocaleDateString()}
                          </div>
                        )}
                        {hackathon.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {hackathon.location}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {hackathon.status && (
                        <Badge className={
                          hackathon.status === 'completed' ? 'bg-green-600' :
                          hackathon.status === 'ongoing' ? 'bg-blue-600' :
                          'bg-gray-600'
                        }>
                          {hackathon.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-effect p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No hackathon participation yet</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
