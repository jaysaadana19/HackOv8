import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Plus, Edit, Trash2, Users, FileText, Eye, Bell, Sun, Moon, Settings, UserPlus, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, referralAPI } from '@/lib/api';
import CreateHackathonModal from '@/components/CreateHackathonModal';
import EditHackathonModal from '@/components/EditHackathonModal';
import ViewRegistrationsModal from '@/components/ViewRegistrationsModal';
import NotifyParticipantsModal from '@/components/NotifyParticipantsModal';
import ManageCoOrganizersModal from '@/components/ManageCoOrganizersModal';
import ManageJudgesModal from '@/components/ManageJudgesModal';
import ReferralAnalyticsModal from '@/components/ReferralAnalyticsModal';
import ManageCertificatesModal from '@/components/ManageCertificatesModal';
import axios from 'axios';
import { getHackathonBanner } from '@/lib/bannerImages';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [myHackathons, setMyHackathons] = useState([]);
  const [registrationCounts, setRegistrationCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showCoOrganizersModal, setShowCoOrganizersModal] = useState(false);
  const [showJudgesModal, setShowJudgesModal] = useState(false);
  const [showReferralAnalytics, setShowReferralAnalytics] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    fetchMyHackathons();
  }, []);

  const fetchMyHackathons = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      const response = await axios.get(`${API_URL}/hackathons/organizer/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyHackathons(response.data);
      
      // Fetch registration counts for each hackathon
      const counts = {};
      await Promise.all(
        response.data.map(async (hackathon) => {
          try {
            const countRes = await hackathonAPI.getRegistrationCount(hackathon.id);
            counts[hackathon.id] = countRes.data.count;
          } catch (err) {
            counts[hackathon.id] = 0;
          }
        })
      );
      setRegistrationCounts(counts);
    } catch (error) {
      toast.error('Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (hackathonId, currentStatus) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      await hackathonAPI.update(hackathonId, { status: newStatus });
      toast.success(`Hackathon ${newStatus === 'published' ? 'published' : 'unpublished'}`);
      fetchMyHackathons();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (hackathonId) => {
    if (!window.confirm('Are you sure you want to delete this hackathon?')) return;
    
    try {
      await hackathonAPI.delete(hackathonId);
      toast.success('Hackathon deleted');
      fetchMyHackathons();
    } catch (error) {
      toast.error('Failed to delete hackathon');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400 p-2">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            <span className="text-lg sm:text-xl font-bold gradient-text">Organizer Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/settings')}
              className="text-gray-400 hover:text-teal-400"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={toggleTheme}
              className="text-gray-400 hover:text-white"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-20 sm:pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 break-words">
              My <span className="gradient-text">Hackathons</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Create and manage your hackathons</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base"
            data-testid="create-hackathon-btn"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Create Hackathon
          </Button>
        </div>

        {myHackathons.length === 0 ? (
          <Card className="glass-effect p-8 sm:p-12 text-center">
            <Rocket className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">No hackathons yet</h3>
            <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Create your first hackathon to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Create Your First Hackathon
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {myHackathons.map((hackathon) => (
              <Card key={hackathon.id} className="glass-effect hover-lift overflow-hidden" data-testid={`hackathon-card-${hackathon.id}`}>
                <div className="h-32 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                  <img src={getHackathonBanner(hackathon)} alt={hackathon.title} className="w-full h-full object-cover" />
                </div>

                <div className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 flex-1">{hackathon.title}</h3>
                    <Badge className={`status-badge ${hackathon.status === 'published' ? 'status-live' : 'status-completed'} text-xs flex-shrink-0`}>
                      {hackathon.status}
                    </Badge>
                  </div>

                  <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">{hackathon.description}</p>
                  
                  {/* Registration Count */}
                  <div className="flex items-center gap-2 text-xs sm:text-sm bg-purple-900/20 px-2 sm:px-3 py-2 rounded-lg border border-purple-800/30">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                    <span className="text-white font-semibold truncate">{registrationCounts[hackathon.id] || 0} Registrations</span>
                  </div>

                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-400 hover:text-purple-400 hover:bg-purple-900/20"
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowRegistrationsModal(true);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View Registrations
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-400 hover:text-blue-400 hover:bg-blue-900/20"
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowNotifyModal(true);
                      }}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notify Participants
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-400 hover:text-teal-400 hover:bg-teal-900/20"
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowCoOrganizersModal(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Manage Co-organizers
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-400 hover:text-purple-400 hover:bg-purple-900/20"
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowJudgesModal(true);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign Judges
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-400 hover:text-blue-400 hover:bg-blue-900/20"
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowReferralAnalytics(true);
                      }}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Referral Analytics
                    </Button>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-gray-400 hover:text-white"
                      onClick={() => navigate(`/hackathon/${hackathon.slug}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-purple-400"
                      onClick={() => {
                        setSelectedHackathon(hackathon);
                        setShowEditModal(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-purple-400"
                      onClick={() => handleStatusToggle(hackathon.id, hackathon.status)}
                    >
                      {hackathon.status === 'published' ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-400"
                      onClick={() => handleDelete(hackathon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateHackathonModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchMyHackathons();
          }}
        />
      )}

      {showEditModal && selectedHackathon && (
        <EditHackathonModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowEditModal(false);
            setSelectedHackathon(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedHackathon(null);
            fetchMyHackathons();
          }}
        />
      )}

      {showRegistrationsModal && selectedHackathon && (
        <ViewRegistrationsModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowRegistrationsModal(false);
            setSelectedHackathon(null);
          }}
        />
      )}

      {showNotifyModal && selectedHackathon && (
        <NotifyParticipantsModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowNotifyModal(false);
            setSelectedHackathon(null);
          }}
          onSuccess={() => {
            fetchMyHackathons();
          }}
        />
      )}

      {showCoOrganizersModal && selectedHackathon && (
        <ManageCoOrganizersModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowCoOrganizersModal(false);
            setSelectedHackathon(null);
          }}
          onSuccess={() => {
            fetchMyHackathons();
          }}
        />
      )}

      {showJudgesModal && selectedHackathon && (
        <ManageJudgesModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowJudgesModal(false);
            setSelectedHackathon(null);
          }}
          onSuccess={() => {
            fetchMyHackathons();
          }}
        />
      )}

      {showReferralAnalytics && selectedHackathon && (
        <ReferralAnalyticsModal
          hackathon={selectedHackathon}
          onClose={() => {
            setShowReferralAnalytics(false);
            setSelectedHackathon(null);
          }}
        />
      )}
    </div>
  );
}
