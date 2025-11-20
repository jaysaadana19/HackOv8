import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Github, Linkedin, Twitter, Globe, 
  Briefcase, GraduationCap, Code, Award, FileText, Mail,
  Calendar, ExternalLink, Download, Sparkles, Zap, Target, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

// Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"></div>
    <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
  </div>
);

// CSS Animations
const styles = `
  @keyframes blob {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .animation-delay-2000 {
    animation-delay: 2s;
  }
  .animation-delay-4000 {
    animation-delay: 4s;
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .skill-badge {
    transition: all 0.3s ease;
  }
  .skill-badge:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }
  @media print {
    .no-print { display: none !important; }
    .animated-background { display: none; }
    body { background: white !important; }
  }
`;

export default function PublicProfileCV() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPublicProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/public/${slug}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchPublicProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center print:bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading CV...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">This profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700 text-white">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Present';
    try {
      const [year, month] = dateStr.split('-');
      if (!year || !month) return dateStr;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(month) - 1;
      if (monthIndex < 0 || monthIndex > 11) return dateStr;
      return `${months[monthIndex]} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr || '';
    }
  };

  return (
    <div className="min-h-screen relative print:bg-white">
      <style>{styles}</style>
      
      {/* Animated Background */}
      <div className="no-print">
        <AnimatedBackground />
      </div>

      {/* Floating Header - No Print */}
      <div className="no-print fixed top-4 left-1/2 transform -translate-x-1/2 z-50 glass-card rounded-full px-6 py-3 shadow-2xl">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          <div className="w-px h-6 bg-gray-300"></div>
          <Button 
            onClick={() => window.print()} 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download PDF</span>
          </Button>
        </div>
      </div>

      {/* CV Container */}
      <div className="max-w-5xl mx-auto px-4 py-20 print:py-0 print:px-0">
        <div className="glass-card rounded-3xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          
          {/* Hero Header Section */}
          <div className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white p-12 print:bg-purple-700 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32 no-print"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24 no-print"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Photo with cool border */}
                {profile.profile_photo ? (
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 no-print"></div>
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                      <img 
                        src={`${process.env.REACT_APP_BACKEND_URL}${profile.profile_photo}`}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-4 border-white/50">
                    <Sparkles className="w-16 h-16 text-white" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-3 justify-center md:justify-start mb-2 no-print">
                    <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                    <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
                      Available for Opportunities
                    </span>
                  </div>
                  
                  <h1 className="text-5xl md:text-6xl font-black mb-3 leading-tight drop-shadow-lg">
                    {profile.name}
                  </h1>
                  
                  {profile.current_status && (
                    <div className="text-xl md:text-2xl font-semibold mb-4 opacity-95 flex items-center gap-2 justify-center md:justify-start">
                      <Rocket className="w-5 h-5 md:w-6 md:h-6" />
                      {profile.current_status}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm mb-6 justify-center md:justify-start">
                    {profile.location && (
                      <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.email && (
                      <span className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur">
                        <Mail className="w-4 h-4" />
                        {profile.email}
                      </span>
                    )}
                  </div>

                  {/* Social Links with hover effects */}
                  <div className="flex gap-4 justify-center md:justify-start">
                    {profile.github_link && (
                      <a href={profile.github_link} target="_blank" rel="noopener noreferrer" 
                         className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:text-purple-600 transition-all duration-300 hover:scale-110 hover:shadow-xl">
                        <Github className="w-6 h-6" />
                      </a>
                    )}
                    {profile.linkedin_link && (
                      <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer"
                         className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-110 hover:shadow-xl">
                        <Linkedin className="w-6 h-6" />
                      </a>
                    )}
                    {profile.twitter_link && (
                      <a href={profile.twitter_link} target="_blank" rel="noopener noreferrer"
                         className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:text-sky-500 transition-all duration-300 hover:scale-110 hover:shadow-xl">
                        <Twitter className="w-6 h-6" />
                      </a>
                    )}
                    {profile.portfolio_link && (
                      <a href={profile.portfolio_link} target="_blank" rel="noopener noreferrer"
                         className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white hover:text-indigo-600 transition-all duration-300 hover:scale-110 hover:shadow-xl">
                        <Globe className="w-6 h-6" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio with cool styling */}
              {profile.bio && (
                <div className="mt-8 p-6 bg-white/10 backdrop-blur rounded-2xl border border-white/20">
                  <p className="text-lg leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12 space-y-10 bg-white print:space-y-6">

            {/* Current Status Banner */}
            {profile.current_status && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 p-6 rounded-lg print:break-inside-avoid">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Current Status</p>
                    <p className="text-lg font-semibold text-gray-800">{profile.current_status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Skills with 3D effect */}
            {Array.isArray(profile.skills) && profile.skills.length > 0 && (
              <section className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800">
                    Skills & <span className="gradient-text">Expertise</span>
                  </h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {profile.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="skill-badge px-5 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full text-sm font-semibold shadow-lg print:bg-purple-100 print:text-purple-700 print:border print:border-purple-300 print:shadow-none"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {Array.isArray(profile.experience) && profile.experience.length > 0 && (
              <section className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800">
                    Work <span className="gradient-text">Experience</span>
                  </h2>
                </div>
                <div className="space-y-8">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="relative pl-8 pb-8 border-l-2 border-purple-200 last:border-l-0 last:pb-0 print:break-inside-avoid">
                      <div className="absolute left-0 top-0 w-4 h-4 bg-purple-500 rounded-full -translate-x-[9px] ring-4 ring-white"></div>
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{exp.role}</h3>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(exp.start_date)} - {exp.end_date ? formatDate(exp.end_date) : 'Present'}
                          </span>
                        </div>
                        <div className="text-purple-600 font-semibold mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {exp.company}
                        </div>
                        {exp.description && (
                          <p className="text-gray-700 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <section className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800">
                    <span className="gradient-text">Education</span>
                  </h2>
                </div>
                <div className="space-y-6">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border border-green-200 print:break-inside-avoid">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-800">{edu.degree}</h3>
                        <span className="text-sm text-gray-500">
                          {formatDate(edu.start_date)} - {formatDate(edu.end_date)}
                        </span>
                      </div>
                      <div className="text-green-700 font-semibold mb-1">{edu.institution}</div>
                      {edu.field && <div className="text-gray-600 text-sm mb-2">{edu.field}</div>}
                      {edu.description && (
                        <p className="text-gray-700 text-sm mt-3">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <section className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800">
                    Featured <span className="gradient-text">Projects</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {profile.projects.map((project, idx) => (
                    <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-purple-500 hover:shadow-xl transition-all print:break-inside-avoid">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-bold text-gray-800 flex-1">{project.title}</h3>
                        <div className="flex gap-2">
                          {project.github_link && (
                            <a 
                              href={project.github_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-purple-600 no-print transition-colors"
                              title="View on GitHub"
                            >
                              <Github className="w-5 h-5" />
                            </a>
                          )}
                          {project.link && (
                            <a 
                              href={project.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-purple-600 no-print transition-colors"
                              title="Live Demo"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-4">{project.description}</p>
                      {project.tech_stack && (
                        <div className="flex flex-wrap gap-2">
                          {project.tech_stack.split(',').map((tech, techIdx) => (
                            <span 
                              key={techIdx}
                              className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                            >
                              {tech.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <section className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800">
                    <span className="gradient-text">Achievements</span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {profile.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200 print:break-inside-avoid">
                      <Award className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{achievement.title}</h3>
                        {achievement.description && (
                          <p className="text-sm text-gray-700">{achievement.description}</p>
                        )}
                        {achievement.date && (
                          <p className="text-xs text-gray-500 mt-1">{formatDate(achievement.date)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <section className="print:break-inside-avoid">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-800">
                    <span className="gradient-text">Certifications</span>
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {profile.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-start gap-4 bg-indigo-50 p-5 rounded-lg border border-indigo-200 print:break-inside-avoid">
                      <FileText className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">{cert.title}</h3>
                        <div className="text-sm text-indigo-700 font-medium mt-1">{cert.issuer}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatDate(cert.date)}</div>
                        {cert.link && (
                          <a 
                            href={cert.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 text-xs flex items-center gap-1 mt-2 no-print"
                          >
                            View Credential <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer with CTA */}
            <div className="mt-16 pt-8 border-t border-gray-200 text-center print:hidden">
              <p className="text-gray-600 mb-4">Interested in working together?</p>
              <div className="flex flex-wrap gap-4 justify-center">
                {profile.email && (
                  <a 
                    href={`mailto:${profile.email}`}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-xl transition-all"
                  >
                    Get in Touch
                  </a>
                )}
                {profile.linkedin_link && (
                  <a 
                    href={profile.linkedin_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                  >
                    Connect on LinkedIn
                  </a>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
