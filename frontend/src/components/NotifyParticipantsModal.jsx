import React, { useState } from 'react';
import { X, Send, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { hackathonAPI } from '@/lib/api';

export default function NotifyParticipantsModal({ hackathon, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await hackathonAPI.notifyParticipants(hackathon.id, title, message);
      toast.success(response.data.message);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-effect rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-800/30">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Send Update</h2>
              <p className="text-sm text-gray-400">{hackathon.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <Label htmlFor="notification-title" className="text-white mb-2 block">
              Notification Title
            </Label>
            <Input
              id="notification-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Important Update, Deadline Extension, etc."
              className="bg-gray-900/50 border-gray-700 text-white"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="notification-message" className="text-white mb-2 block">
              Message
            </Label>
            <Textarea
              id="notification-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message for all participants..."
              rows={8}
              className="bg-gray-900/50 border-gray-700 text-white resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-2">
              This notification will be sent to all registered participants
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-gray-700 text-gray-400 hover:bg-gray-900/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Update
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}