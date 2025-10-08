import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Award, FileText, Star, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, judgeAPI } from '@/lib/api';
import ScoreSubmissionModal from '@/components/ScoreSubmissionModal';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScoreModal, setShowScoreModal] = useState(false);

  useEffect(() => {
    fetchAssignedHackathons();
  }, []);

  const fetchAssignedHackathons = async () => {
    setLoading(true);
    try {
      // Get only hackathons where user is assigned as judge
      const response = await hackathonAPI.getJudgeHackathons();
      setHackathons(response.data);
    } catch (error) {
      toast.error('Failed to load assigned hackathons');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async (hackathonId) => {
    try {
      const response = await hackathonAPI.getSubmissions(hackathonId);
      setSubmissions(response.data);
    } catch (error) {
      toast.error('Failed to load submissions');
    }
  };

  const handleViewSubmissions = async (hackathon) => {
    setSelectedHackathon(hackathon);
    await fetchSubmissions(hackathon.id);
  };

  const handleScoreSubmission = (submission) => {
    setSelectedSubmission(submission);
    setShowScoreModal(true);
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
          <Rocket className="w-6 h-6 text-teal-500" />
          <span className="text-xl font-bold gradient-text">Judge Dashboard</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {!selectedHackathon ? (
          <>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">
                Judge <span className="gradient-text">Submissions</span>
              </h1>
              <p className="text-gray-400">Review and score hackathon projects</p>
            </div>

            {hackathons.length === 0 ? (
              <Card className="glass-effect p-12 text-center">
                <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No hackathons available</h3>
                <p className="text-gray-400">You haven't been assigned to any hackathons yet</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hackathons.map((hackathon) => (
                  <Card key={hackathon.id} className="glass-effect hover-lift overflow-hidden" data-testid={`judge-hackathon-${hackathon.id}`}>
                    <div className="h-32 bg-gradient-to-br from-teal-600/30 to-teal-900/30 flex items-center justify-center">
                      <Award className="w-12 h-12 text-teal-500" />
                    </div>

                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{hackathon.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{hackathon.description}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-teal-500" />
                        <span className="text-gray-400">View submissions to score</span>
                      </div>

                      <Button
                        onClick={() => handleViewSubmissions(hackathon)}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                        data-testid={`view-submissions-${hackathon.id}`}
                      >
                        View Submissions
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setSelectedHackathon(null)}
                className="text-gray-400 mb-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Hackathons
              </Button>
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">{selectedHackathon.title}</span> - Submissions
              </h1>
              <p className="text-gray-400">Score projects based on the judging rubric</p>
            </div>

            {selectedHackathon.judging_rubric && selectedHackathon.judging_rubric.length > 0 && (
              <Card className="glass-effect p-6 mb-6">
                <h3 className="font-bold text-lg text-white mb-4">Judging Criteria</h3>
                <div className="flex gap-4 flex-wrap">
                  {selectedHackathon.judging_rubric.map((rubric, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-teal-900/20 px-4 py-2 rounded-lg">
                      <Star className="w-4 h-4 text-teal-500" />
                      <span className="text-white">{rubric.criteria}</span>
                      <span className="text-gray-400 text-sm">({rubric.max_score} pts)</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {submissions.length === 0 ? (
              <Card className="glass-effect p-12 text-center">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No submissions yet</h3>
                <p className="text-gray-400">Teams haven't submitted their projects</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="glass-effect p-6" data-testid={`submission-${submission.id}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{submission.project_name}</h3>
                        <p className="text-sm text-gray-500">Team ID: {submission.team_id}</p>
                      </div>
                      <Badge className="status-badge status-live">Submitted</Badge>
                    </div>

                    <p className="text-gray-400 mb-4">{submission.description}</p>

                    <div className="space-y-2 mb-4 text-sm">
                      {submission.repo_link && (
                        <a
                          href={submission.repo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 block"
                        >
                          🔗 GitHub Repository
                        </a>
                      )}
                      {submission.video_link && (
                        <a
                          href={submission.video_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 block"
                        >
                          🎥 Video Demo
                        </a>
                      )}
                      {submission.demo_link && (
                        <a
                          href={submission.demo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-400 hover:text-teal-300 block"
                        >
                          🚀 Live Demo
                        </a>
                      )}
                    </div>

                    <Button
                      onClick={() => handleScoreSubmission(submission)}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                      data-testid={`score-btn-${submission.id}`}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Score This Project
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showScoreModal && selectedSubmission && selectedHackathon && (
        <ScoreSubmissionModal
          submission={selectedSubmission}
          hackathon={selectedHackathon}
          onClose={() => setShowScoreModal(false)}
          onSuccess={() => {
            setShowScoreModal(false);
            toast.success('Score submitted successfully!');
            fetchSubmissions(selectedHackathon.id);
          }}
        />
      )}
    </div>
  );
}
