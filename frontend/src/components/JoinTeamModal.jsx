import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { teamAPI } from '@/lib/api';

export default function JoinTeamModal({ onClose, onSuccess }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Invite code is required');
      return;
    }

    setLoading(true);
    try {
      await teamAPI.join(inviteCode);
      toast.success('Joined team successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to join team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Join Team</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Invite Code</label>
            <Input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white font-mono"
              placeholder="Enter invite code"
              data-testid="invite-code-input"
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
              data-testid="join-team-submit"
            >
              {loading ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
