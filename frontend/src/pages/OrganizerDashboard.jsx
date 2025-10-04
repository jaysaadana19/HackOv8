import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Plus, Edit, Trash2, Users, FileText, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI } from '@/lib/api';
import CreateHackathonModal from '@/components/CreateHackathonModal';
import EditHackathonModal from '@/components/EditHackathonModal';
import ViewRegistrationsModal from '@/components/ViewRegistrationsModal';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function OrganizerDashboard() {
  const navigate = useNavigate();
  const [myHackathons, setMyHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedHackathon, setSelectedHackathon] = useState(null);

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
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold gradient-text">Organizer Dashboard</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              My <span className="gradient-text">Hackathons</span>
            </h1>
            <p className="text-gray-400">Create and manage your hackathons</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            data-testid="create-hackathon-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Hackathon
          </Button>
        </div>

        {myHackathons.length === 0 ? (
          <Card className="glass-effect p-12 text-center">
            <Rocket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hackathons yet</h3>
            <p className="text-gray-400 mb-6">Create your first hackathon to get started</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Hackathon
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myHackathons.map((hackathon) => (
              <Card key={hackathon.id} className="glass-effect hover-lift overflow-hidden" data-testid={`hackathon-card-${hackathon.id}`}>
                <div className="h-32 bg-gradient-to-br from-purple-600/30 to-purple-900/30 flex items-center justify-center relative overflow-hidden">
                  {hackathon.cover_image ? (
                    <img src={hackathon.cover_image} alt={hackathon.title} className="w-full h-full object-cover" />
                  ) : (
                    <Rocket className="w-12 h-12 text-purple-500" />
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-white">{hackathon.title}</h3>
                    <Badge className={`status-badge ${hackathon.status === 'published' ? 'status-live' : 'status-completed'}`}>
                      {hackathon.status}
                    </Badge>
                  </div>

                  <p className="text-gray-400 text-sm line-clamp-2">{hackathon.description}</p>

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
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-gray-400 hover:text-white"
                      onClick={() => navigate(`/hackathon/${hackathon.id}`)}
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
    </div>
  );
}
