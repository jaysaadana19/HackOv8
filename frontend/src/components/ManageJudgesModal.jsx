import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { hackathonAPI } from '@/lib/api';

export default function ManageJudgesModal({ hackathon, onClose, onSuccess }) {
  const [assignedJudges, setAssignedJudges] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetchAssignedJudges();
  }, []);

  const fetchAssignedJudges = async () => {
    setLoadingList(true);
    try {
      const response = await hackathonAPI.getAssignedJudges(hackathon.id);
      setAssignedJudges(response.data);
    } catch (error) {
      toast.error('Failed to load assigned judges');
    } finally {
      setLoadingList(false);
    }
  };

  const handleAssignJudge = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email');
      return;
    }

    setLoading(true);
    try {
      const response = await hackathonAPI.assignJudge(hackathon.id, email);
      toast.success(response.data.message);
      setEmail('');
      fetchAssignedJudges();
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign judge');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveJudge = async (judgeId) => {
    if (!window.confirm('Remove this judge from this hackathon?')) return;

    try {
      await hackathonAPI.removeAssignedJudge(hackathon.id, judgeId);
      toast.success('Judge assignment removed');
      fetchAssignedJudges();
      onSuccess();
    } catch (error) {
      toast.error('Failed to remove judge');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <Card className="bg-white border-gray-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-white backdrop-blur-md p-6 border-b border-gray-200 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold gradient-text">Manage Judges</h2>
            <p className="text-gray-600 text-sm mt-1">{hackathon.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Judge Form */}
          <form onSubmit={handleAssignJudge} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-900 mb-2 block">
                Assign Judge by Email
              </Label>
              <p className="text-sm text-gray-600 mb-3">
                Enter the email of a registered judge. They will be able to view and evaluate this hackathon in their judge dashboard.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="judge@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-white border-gray-300 text-gray-900"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * User must be registered as a judge on the platform
              </p>
            </div>
          </form>

          {/* Assigned Judges List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assigned Judges</h3>
            {loadingList ? (
              <div className="text-center py-8 text-gray-600">Loading...</div>
            ) : assignedJudges.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No judges assigned yet</p>
                <p className="text-gray-500 text-sm mt-1">Assign judges to evaluate submissions for this hackathon</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedJudges.map((judge) => (
                  <Card key={judge.id} className="bg-gray-50 border-gray-200 p-4 flex items-center justify-between hover:border-teal-300 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{judge.name}</p>
                        <p className="text-sm text-gray-600">{judge.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveJudge(judge.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <div className="sticky bottom-0 bg-gray-50 backdrop-blur-md p-6 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
