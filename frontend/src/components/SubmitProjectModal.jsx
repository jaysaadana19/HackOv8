import React, { useState } from 'react';
import { X, Upload, Github, Play, Video, ExternalLink, Rocket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { submissionAPI } from '@/lib/api';

export default function SubmitProjectModal({ teamId, hackathonId, onClose, onSuccess }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [repoLink, setRepoLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !description.trim()) {
      toast.error('Project name and description are required');
      return;
    }

    setLoading(true);
    try {
      await submissionAPI.create({
        team_id: teamId,
        hackathon_id: hackathonId,
        project_name: projectName,
        description,
        repo_link: repoLink,
        video_link: videoLink,
        demo_link: demoLink,
      });
      toast.success('Project submitted successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-effect rounded-2xl p-8 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Submit Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Project Name *</label>
            <Input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white"
              placeholder="Your awesome project"
              data-testid="project-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Description *</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white min-h-24"
              placeholder="Describe your project..."
              data-testid="project-description"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">GitHub Repository</label>
            <Input
              type="url"
              value={repoLink}
              onChange={(e) => setRepoLink(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white"
              placeholder="https://github.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Video Demo</label>
            <Input
              type="url"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white"
              placeholder="https://youtube.com/..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Live Demo</label>
            <Input
              type="url"
              value={demoLink}
              onChange={(e) => setDemoLink(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white"
              placeholder="https://your-demo.com"
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
              data-testid="submit-project-btn-modal"
            >
              {loading ? 'Submitting...' : 'Submit Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
