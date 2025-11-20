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

  useEffect(() => {
    fetchPublicProfile();
  }, [slug]);

  const fetchPublicProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/public/${slug}`);
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setTimeout(() => navigate('/'), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center print:bg-white">
        <div className="text-gray-600">Loading CV...</div>
      </div>
    );
  }

  if (!profile) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>

      {/* Header - No Print */}
      <div className="no-print bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <Button onClick={() => window.print()} className="bg-purple-600 hover:bg-purple-700">
            Download PDF
          </Button>
        </div>
      </div>

      {/* CV Container */}
      <div className="max-w-4xl mx-auto p-8 print:p-0">
        <div className="bg-white shadow-lg print:shadow-none">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-8 print:bg-purple-700">
            <div className="flex items-start gap-6">
              {/* Photo */}
              {profile.profile_photo && (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white flex-shrink-0">
                  <img 
                    src={`${process.env.REACT_APP_BACKEND_URL}${profile.profile_photo}`}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
                
                {profile.current_role && (
                  <div className="text-xl font-medium mb-2 opacity-90">
                    {profile.current_role}
                    {profile.current_company && ` @ ${profile.current_company}`}
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-sm opacity-90 mb-3">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </span>
                  )}
                  {profile.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </span>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-3">
                  {profile.github_link && (
                    <a href={profile.github_link} target="_blank" rel="noopener noreferrer" 
                       className="hover:scale-110 transition-transform">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {profile.linkedin_link && (
                    <a href={profile.linkedin_link} target="_blank" rel="noopener noreferrer"
                       className="hover:scale-110 transition-transform">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile.twitter_link && (
                    <a href={profile.twitter_link} target="_blank" rel="noopener noreferrer"
                       className="hover:scale-110 transition-transform">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.portfolio_link && (
                    <a href={profile.portfolio_link} target="_blank" rel="noopener noreferrer"
                       className="hover:scale-110 transition-transform">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4 text-sm opacity-90 leading-relaxed">
                {profile.bio}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <Code className="w-6 h-6 text-purple-600" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium print:border print:border-purple-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <Briefcase className="w-6 h-6 text-purple-600" />
                  Experience
                </h2>
                <div className="space-y-6">
                  {profile.experience.map((exp, idx) => (
                    <div key={idx} className="border-l-2 border-purple-600 pl-4 print:break-inside-avoid">
                      <h3 className="text-lg font-semibold text-gray-800">{exp.title}</h3>
                      <div className="text-purple-600 font-medium">{exp.company}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(exp.start_date)} - {exp.current ? 'Present' : formatDate(exp.end_date)}
                      </div>
                      {exp.description && (
                        <p className="mt-2 text-gray-700 text-sm leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                  Education
                </h2>
                <div className="space-y-4">
                  {profile.education.map((edu, idx) => (
                    <div key={idx} className="border-l-2 border-blue-600 pl-4 print:break-inside-avoid">
                      <h3 className="text-lg font-semibold text-gray-800">{edu.degree}</h3>
                      <div className="text-blue-600 font-medium">{edu.institution}</div>
                      <div className="text-sm text-gray-500">{edu.year}</div>
                      {edu.description && (
                        <p className="mt-2 text-gray-700 text-sm">{edu.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <FileText className="w-6 h-6 text-purple-600" />
                  Projects
                </h2>
                <div className="grid gap-4">
                  {profile.projects.map((project, idx) => (
                    <Card key={idx} className="p-4 border border-gray-200 print:break-inside-avoid">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 no-print"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mt-2">{project.description}</p>
                      {project.technologies && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.technologies.map((tech, techIdx) => (
                            <span 
                              key={techIdx}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <Award className="w-6 h-6 text-purple-600" />
                  Achievements
                </h2>
                <ul className="space-y-2">
                  {profile.achievements.map((achievement, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                      <span className="text-purple-600 mt-1">•</span>
                      <span className="text-sm">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <section className="print:break-inside-avoid">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                  <Award className="w-6 h-6 text-purple-600" />
                  Certifications
                </h2>
                <div className="space-y-3">
                  {profile.certifications.map((cert, idx) => (
                    <div key={idx} className="flex justify-between items-start print:break-inside-avoid">
                      <div>
                        <h3 className="font-semibold text-gray-800">{cert.name}</h3>
                        <div className="text-sm text-gray-600">{cert.issuer}</div>
                        <div className="text-xs text-gray-500">{cert.date}</div>
                      </div>
                      {cert.link && (
                        <a 
                          href={cert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 no-print"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
