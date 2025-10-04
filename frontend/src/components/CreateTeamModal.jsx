import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { teamAPI } from '@/lib/api';

export default function CreateTeamModal({ hackathonId, onClose, onSuccess }) {
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTeam, setCreatedTeam] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await teamAPI.create({ name: teamName, hackathon_id: hackathonId });
      setCreatedTeam(response.data);
      toast.success('Team created successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(createdTeam.invite_code);
    setCopied(true);
    toast.success('Invite code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDone = () => {
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Team</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Team Name</label>
            <Input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white"
              placeholder="Enter team name"
              data-testid="team-name-input"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-gray-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="create-team-submit"
            >
              {loading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
