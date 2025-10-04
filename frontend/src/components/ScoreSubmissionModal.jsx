import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { judgeAPI } from '@/lib/api';

export default function ScoreSubmissionModal({ submission, hackathon, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState(
    hackathon.judging_rubric.reduce((acc, rubric) => ({
      ...acc,
      [rubric.criteria]: 5
    }), {})
  );
  const [feedback, setFeedback] = useState('');

  const handleScoreChange = (criteria, value) => {
    setScores({ ...scores, [criteria]: value[0] });
  };

  const calculateTotal = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await judgeAPI.submitScore({
        submission_id: submission.id,
        rubric_scores: scores,
        feedback
      });
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit score');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-effect rounded-2xl p-8 max-w-2xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Score Submission</h2>
            <p className="text-gray-400 text-sm mt-1">{submission.project_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <h3 className="font-semibold text-white">Judging Criteria</h3>
            
            {hackathon.judging_rubric.map((rubric, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">{rubric.criteria}</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold gradient-text">{scores[rubric.criteria]}</span>
                    <span className="text-gray-500">/ {rubric.max_score}</span>
                  </div>
                </div>
                
                <Slider
                  value={[scores[rubric.criteria]]}
                  onValueChange={(value) => handleScoreChange(rubric.criteria, value)}
                  max={rubric.max_score}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>
            ))}

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-lg">
                <span className="font-semibold text-white">Total Score</span>
                <span className="text-3xl font-bold gradient-text">{calculateTotal()}</span>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-400 mb-2 block">Feedback (Optional)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white min-h-24"
              placeholder="Provide constructive feedback for the team..."
              data-testid="score-feedback"
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
              data-testid="submit-score-btn"
            >
              <Star className="w-4 h-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit Score'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
