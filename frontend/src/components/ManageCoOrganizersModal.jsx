import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { hackathonAPI } from '@/lib/api';

export default function ManageCoOrganizersModal({ hackathon, onClose, onSuccess }) {
  const [coOrganizers, setCoOrganizers] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetchCoOrganizers();
  }, []);

  const fetchCoOrganizers = async () => {
    setLoadingList(true);
    try {
      const response = await hackathonAPI.getCoOrganizers(hackathon.id);
      setCoOrganizers(response.data);
    } catch (error) {
      toast.error('Failed to load co-organizers');
    } finally {
      setLoadingList(false);
    }
  };

  const handleAddCoOrganizer = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    setLoading(true);
    try {
      const response = await hackathonAPI.addCoOrganizer(hackathon.id, email);
      toast.success(response.data.message);
      setEmail('');
      fetchCoOrganizers();
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add co-organizer');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoOrganizer = async (userId) => {
    if (!window.confirm('Remove this co-organizer?')) return;

    try {
      await hackathonAPI.removeCoOrganizer(hackathon.id, userId);
      toast.success('Co-organizer removed');
      fetchCoOrganizers();
      onSuccess();
    } catch (error) {
      toast.error('Failed to remove co-organizer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <Card className="bg-white border-gray-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-500 to-teal-600 backdrop-blur-md p-6 border-b border-teal-200 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold gradient-text">Manage Co-organizers</h2>
            <p className="text-gray-400 text-sm mt-1">{hackathon.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Co-organizer Form */}
          <form onSubmit={handleAddCoOrganizer} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-white mb-2 block">
                Add Co-organizer by Email
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="organizer@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-900/50 border-gray-700 text-white"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * User must be registered on the platform
              </p>
            </div>
          </form>

          {/* Co-organizers List */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Current Co-organizers</h3>
            {loadingList ? (
              <div className="text-center py-8 text-gray-400">Loading...</div>
            ) : coOrganizers.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No co-organizers yet</p>
                <p className="text-gray-500 text-sm mt-1">Add co-organizers to collaborate on this event</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coOrganizers.map((coOrg) => (
                  <Card key={coOrg.id} className="bg-gray-900/30 border-gray-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{coOrg.name}</p>
                        <p className="text-sm text-gray-400">{coOrg.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCoOrganizer(coOrg.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/80 backdrop-blur-md p-6 border-t border-gray-800 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
