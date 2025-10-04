import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { hackathonAPI } from '@/lib/api';

export default function CreateHackathonModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('online');
  const [venue, setVenue] = useState('');
  const [regStart, setRegStart] = useState('');
  const [regEnd, setRegEnd] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [minTeamSize, setMinTeamSize] = useState(1);
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [prizes, setPrizes] = useState([{ place: '', amount: '', description: '' }]);
  const [rules, setRules] = useState('');

  const handleAddPrize = () => {
    setPrizes([...prizes, { place: '', amount: '', description: '' }]);
  };

  const handleRemovePrize = (index) => {
    setPrizes(prizes.filter((_, i) => i !== index));
  };

  const handlePrizeChange = (index, field, value) => {
    const updated = [...prizes];
    updated[index][field] = value;
    setPrizes(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !description || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const data = {
        title,
        description,
        cover_image: coverImage || null,
        category,
        location,
        venue: location !== 'online' ? venue : null,
        registration_start: new Date(regStart).toISOString(),
        registration_end: new Date(regEnd).toISOString(),
        event_start: new Date(eventStart).toISOString(),
        event_end: new Date(eventEnd).toISOString(),
        submission_deadline: new Date(submissionDeadline).toISOString(),
        min_team_size: parseInt(minTeamSize),
        max_team_size: parseInt(maxTeamSize),
        prizes: prizes.filter(p => p.place && p.amount),
        rules,
        judging_rubric: [
          { criteria: 'Innovation', max_score: 10 },
          { criteria: 'Technical Implementation', max_score: 10 },
          { criteria: 'Design & UX', max_score: 10 },
          { criteria: 'Impact', max_score: 10 }
        ],
        faqs: []
      };

      await hackathonAPI.create(data);
      toast.success('Hackathon created successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create hackathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-effect rounded-2xl p-8 max-w-3xl w-full my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Create Hackathon</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Title *</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="AI Innovation Challenge 2025"
                data-testid="hackathon-title"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white min-h-24"
                placeholder="Describe your hackathon..."
                data-testid="hackathon-description"
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Banner Image URL</Label>
              <Input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="https://example.com/banner.jpg"
                data-testid="hackathon-cover-image"
              />
              {coverImage && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-800">
                  <img src={coverImage} alt="Banner preview" className="w-full h-48 object-cover" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Category *</Label>
              <Input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="AI/ML, Web3, Mobile, etc."
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Location *</Label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 text-white px-4 py-2 rounded-lg"
              >
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {location !== 'online' && (
              <div className="md:col-span-2">
                <Label className="text-gray-400 mb-2 block">Venue</Label>
                <Input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Tech Hub, San Francisco"
                />
              </div>
            )}

            <div>
              <Label className="text-gray-400 mb-2 block">Registration Start *</Label>
              <Input
                type="datetime-local"
                value={regStart}
                onChange={(e) => setRegStart(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Registration End *</Label>
              <Input
                type="datetime-local"
                value={regEnd}
                onChange={(e) => setRegEnd(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Event Start *</Label>
              <Input
                type="datetime-local"
                value={eventStart}
                onChange={(e) => setEventStart(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Event End *</Label>
              <Input
                type="datetime-local"
                value={eventEnd}
                onChange={(e) => setEventEnd(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Submission Deadline *</Label>
              <Input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Team Size</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Min"
                />
                <Input
                  type="number"
                  min="1"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Max"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Prizes</Label>
              <div className="space-y-3">
                {prizes.map((prize, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="text"
                      value={prize.place}
                      onChange={(e) => handlePrizeChange(index, 'place', e.target.value)}
                      className="bg-gray-900/50 border-gray-800 text-white flex-1"
                      placeholder="1st Place"
                    />
                    <Input
                      type="text"
                      value={prize.amount}
                      onChange={(e) => handlePrizeChange(index, 'amount', e.target.value)}
                      className="bg-gray-900/50 border-gray-800 text-white flex-1"
                      placeholder="$10,000"
                    />
                    {prizes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handleRemovePrize(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddPrize}
                  className="border-gray-700 text-gray-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prize
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Rules</Label>
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white min-h-24"
                placeholder="Enter hackathon rules and guidelines..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-6 border-t border-gray-800">
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
              data-testid="create-hackathon-submit"
            >
              {loading ? 'Creating...' : 'Create Hackathon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
