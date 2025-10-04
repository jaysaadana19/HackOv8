import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { hackathonAPI } from '@/lib/api';

export default function EditHackathonModal({ hackathon, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(hackathon.title);
  const [description, setDescription] = useState(hackathon.description);
  const [rules, setRules] = useState(hackathon.rules || '');
  const [status, setStatus] = useState(hackathon.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description) {
      toast.error('Title and description are required');
      return;
    }

    setLoading(true);
    try {
      await hackathonAPI.update(hackathon.id, {
        title,
        description,
        rules,
        status
      });
      toast.success('Hackathon updated successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update hackathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-effect rounded-2xl p-8 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Hackathon</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-gray-400 mb-2 block">Title</Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-400 mb-2 block">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white min-h-24"
            />
          </div>

          <div>
            <Label className="text-gray-400 mb-2 block">Rules</Label>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white min-h-24"
            />
          </div>

          <div>
            <Label className="text-gray-400 mb-2 block">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 text-white px-4 py-2 rounded-lg"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
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
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
