import React, { useState } from 'react';
import { X, Plus, Trash2, Upload, Image as ImageIcon, Twitter, Linkedin, Globe, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { hackathonAPI, uploadAPI } from '@/lib/api';

export default function CreateHackathonModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [imageMode, setImageMode] = useState('url'); // 'url' or 'upload'
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
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [communityUrl, setCommunityUrl] = useState('');
  const [communityType, setCommunityType] = useState('slack');
  const [sponsors, setSponsors] = useState([{ name: '', logo: '', website: '' }]);
  const [judges, setJudges] = useState([{ name: '', photo: '', bio: '', linkedin: '' }]);

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

  const handleAddSponsor = () => {
    setSponsors([...sponsors, { name: '', logo: '', website: '' }]);
  };

  const handleRemoveSponsor = (index) => {
    setSponsors(sponsors.filter((_, i) => i !== index));
  };

  const handleSponsorChange = (index, field, value) => {
    const updated = [...sponsors];
    updated[index][field] = value;
    setSponsors(updated);
  };

  const handleAddJudge = () => {
    setJudges([...judges, { name: '', photo: '', bio: '', linkedin: '' }]);
  };

  const handleRemoveJudge = (index) => {
    setJudges(judges.filter((_, i) => i !== index));
  };

  const handleJudgeChange = (index, field, value) => {
    const updated = [...judges];
    updated[index][field] = value;
    setJudges(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (JPG, PNG, SVG)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload JPG, PNG, or SVG image only');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Validate image dimensions (1200x400px)
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      
      if (img.width !== 1200 || img.height !== 400) {
        toast.error('Image must be exactly 1200x400 pixels');
        return;
      }

      // All validations passed, upload the image
      setUploading(true);
      try {
        const response = await uploadAPI.uploadImage(file);
        const imageUrl = process.env.REACT_APP_BACKEND_URL + response.data.url;
        setCoverImage(imageUrl);
        console.log('Image uploaded, URL:', imageUrl);
        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.detail || 'Failed to upload image');
      } finally {
        setUploading(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error('Failed to load image. Please try another file.');
    };

    img.src = objectUrl;
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
        faqs: [],
        twitter_url: twitterUrl || null,
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
        community_url: communityUrl || null,
        community_type: communityUrl ? communityType : null,
        sponsors: sponsors.filter(s => s.name),
        judges: judges.filter(j => j.name)
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
              <Label className="text-gray-400 mb-2 block">Banner Image</Label>
              <Tabs value={imageMode} onValueChange={setImageMode} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-3">
                  <Input
                    type="url"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder="https://example.com/banner.jpg"
                    data-testid="hackathon-cover-image"
                  />
                </TabsContent>
                <TabsContent value="upload" className="mt-3">
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                      onChange={handleFileUpload}
                      className="bg-gray-900/50 border-gray-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-teal-600 file:text-white file:cursor-pointer hover:file:bg-teal-700"
                      disabled={uploading}
                    />
                    {uploading && <div className="loading-spinner"></div>}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Max 5MB • 1200x400px • JPG, PNG, SVG</p>
                </TabsContent>
              </Tabs>
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

            {/* Social Profiles & Community Section */}
            <div className="md:col-span-2 pt-4 border-t border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-500" />
                Social Links & Community (Optional)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400 mb-2 block flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-blue-400" />
                    Twitter/X URL
                  </Label>
                  <Input
                    type="url"
                    value={twitterUrl}
                    onChange={(e) => setTwitterUrl(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder="https://twitter.com/yourusername"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 mb-2 block flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    LinkedIn URL
                  </Label>
                  <Input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 mb-2 block flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-500" />
                    Website URL
                  </Label>
                  <Input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <Label className="text-gray-400 mb-2 block flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-500" />
                    Community Type
                  </Label>
                  <RadioGroup value={communityType} onValueChange={setCommunityType} className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="slack" id="slack" />
                      <Label htmlFor="slack" className="text-gray-300 cursor-pointer">Slack</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="discord" id="discord" />
                      <Label htmlFor="discord" className="text-gray-300 cursor-pointer">Discord</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other" className="text-gray-300 cursor-pointer">Other</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="md:col-span-2">
                  <Label className="text-gray-400 mb-2 block flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-teal-500" />
                    Community URL ({communityType === 'slack' ? 'Slack' : communityType === 'discord' ? 'Discord' : 'Community'})
                  </Label>
                  <Input
                    type="url"
                    value={communityUrl}
                    onChange={(e) => setCommunityUrl(e.target.value)}
                    className="bg-gray-900/50 border-gray-800 text-white"
                    placeholder={communityType === 'slack' ? 'https://yourworkspace.slack.com/...' : communityType === 'discord' ? 'https://discord.gg/...' : 'https://community-link.com'}
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be displayed on the event page for participants to join</p>
                </div>
              </div>
            </div>

            {/* Section Divider */}
            <div className="md:col-span-2 border-t border-gray-700 pt-6 mt-4">
              <h3 className="text-xl font-bold text-white mb-4">Event Partners</h3>
            </div>

            {/* Sponsors Section */}
            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-3 block text-lg font-semibold">
                🏢 Sponsors (Optional)
              </Label>
              <p className="text-sm text-gray-500 mb-3">Add sponsors who are supporting this hackathon</p>
              <div className="space-y-3">
                {sponsors.map((sponsor, index) => (
                  <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="grid md:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        value={sponsor.name}
                        onChange={(e) => handleSponsorChange(index, 'name', e.target.value)}
                        className="bg-gray-900/50 border-gray-800 text-white"
                        placeholder="Sponsor Name"
                      />
                      <Input
                        type="url"
                        value={sponsor.logo}
                        onChange={(e) => handleSponsorChange(index, 'logo', e.target.value)}
                        className="bg-gray-900/50 border-gray-800 text-white"
                        placeholder="Logo URL"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          value={sponsor.website}
                          onChange={(e) => handleSponsorChange(index, 'website', e.target.value)}
                          className="bg-gray-900/50 border-gray-800 text-white"
                          placeholder="Website URL"
                        />
                        {sponsors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveSponsor(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSponsor}
                  className="border-gray-700 text-gray-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sponsor
                </Button>
              </div>
            </div>

            {/* Judges Section */}
            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-3 block text-lg font-semibold">Judges</Label>
              <div className="space-y-3">
                {judges.map((judge, index) => (
                  <div key={index} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <Input
                        type="text"
                        value={judge.name}
                        onChange={(e) => handleJudgeChange(index, 'name', e.target.value)}
                        className="bg-gray-900/50 border-gray-800 text-white"
                        placeholder="Judge Name"
                      />
                      <Input
                        type="url"
                        value={judge.photo}
                        onChange={(e) => handleJudgeChange(index, 'photo', e.target.value)}
                        className="bg-gray-900/50 border-gray-800 text-white"
                        placeholder="Photo URL"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <Input
                        type="url"
                        value={judge.linkedin}
                        onChange={(e) => handleJudgeChange(index, 'linkedin', e.target.value)}
                        className="bg-gray-900/50 border-gray-800 text-white"
                        placeholder="LinkedIn URL"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={judge.bio}
                          onChange={(e) => handleJudgeChange(index, 'bio', e.target.value)}
                          className="bg-gray-900/50 border-gray-800 text-white"
                          placeholder="Short Bio"
                        />
                        {judges.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleRemoveJudge(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddJudge}
                  className="border-gray-700 text-gray-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Judge
                </Button>
              </div>
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
