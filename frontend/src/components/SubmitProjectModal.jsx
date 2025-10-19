import React, { useState } from 'react';
import { X, Upload, Github, Play, Video, ExternalLink, Rocket, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { submissionAPI, teamAPI } from '@/lib/api';
import { getUser } from '@/lib/auth';

export default function SubmitProjectModal({ teamId, hackathonId, isTeamRequired, onClose, onSuccess }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [repoLink, setRepoLink] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [loading, setLoading] = useState(false);
  const user = getUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim() || !description.trim()) {
      toast.error('Project name and description are required');
      return;
    }

    setLoading(true);
    try {
      let finalTeamId = teamId;
      
      // If no team (solo participant), create one automatically
      if (!finalTeamId && isTeamRequired) {
        toast.info('Creating solo team...');
        const teamResponse = await teamAPI.create({
          name: `${user.name}'s Solo Team`,
          hackathon_id: hackathonId
        });
        finalTeamId = teamResponse.data.id;
        toast.success('Solo team created!');
      }
      
      await submissionAPI.create({
        team_id: finalTeamId,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Submit Your Project</h2>
                <p className="text-teal-100 text-sm mt-1">Share your amazing creation with the world</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-teal-100 hover:text-white transition-colors p-1"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Required Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-800">Required Information</h3>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Name *
              </label>
              <Input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                placeholder="Enter your project name..."
                data-testid="project-name-input"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project Description *
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500 min-h-[100px] resize-y"
                placeholder="Describe what your project does, technologies used, and what makes it special..."
                data-testid="project-description"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Mention the problem it solves, key features, and technologies used
              </p>
            </div>
          </div>

          {/* Optional Links Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-5 h-5 text-teal-500" />
              <h3 className="text-lg font-semibold text-gray-800">Project Links</h3>
              <span className="text-sm text-gray-500">(Optional but recommended)</span>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Repository
                </label>
                <Input
                  type="url"
                  value={repoLink}
                  onChange={(e) => setRepoLink(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="https://github.com/username/project"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video Demo
                </label>
                <Input
                  type="url"
                  value={videoLink}
                  onChange={(e) => setVideoLink(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Live Demo
                </label>
                <Input
                  type="url"
                  value={demoLink}
                  onChange={(e) => setDemoLink(e.target.value)}
                  className="bg-gray-50 border-gray-300 text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="https://your-project.netlify.app or https://your-demo.com"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 p-4">
            <div className="flex items-start gap-3">
              <Play className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-teal-800 mb-2">Submission Tips</h4>
                <ul className="text-sm text-teal-700 space-y-1">
                  <li>• Make sure your repository is public and has a clear README</li>
                  <li>• Include setup instructions and any required environment variables</li>
                  <li>• Add screenshots or GIFs to showcase your project visually</li>
                  <li>• Test your demo links to ensure they're working before submission</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !projectName.trim() || !description.trim()}
              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg"
              data-testid="submit-project-btn-modal"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Project
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
