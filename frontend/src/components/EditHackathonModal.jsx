import React, { useState } from 'react';
import { X, Save, Upload, Twitter, Linkedin, Globe, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { hackathonAPI, uploadAPI } from '@/lib/api';

// Helper function to format date for datetime-local input
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function EditHackathonModal({ hackathon, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(hackathon.title);
  const [description, setDescription] = useState(hackathon.description);
  const [coverImage, setCoverImage] = useState(hackathon.cover_image || '');
  const [imageMode, setImageMode] = useState('url');
  const [category, setCategory] = useState(hackathon.category || '');
  const [location, setLocation] = useState(hackathon.location || 'online');
  const [venue, setVenue] = useState(hackathon.venue || '');
  const [regStart, setRegStart] = useState(formatDateForInput(hackathon.registration_start));
  const [regEnd, setRegEnd] = useState(formatDateForInput(hackathon.registration_end));
  const [eventStart, setEventStart] = useState(formatDateForInput(hackathon.event_start));
  const [eventEnd, setEventEnd] = useState(formatDateForInput(hackathon.event_end));
  const [submissionDeadline, setSubmissionDeadline] = useState(formatDateForInput(hackathon.submission_deadline));
  const [minTeamSize, setMinTeamSize] = useState(hackathon.min_team_size || 1);
  const [maxTeamSize, setMaxTeamSize] = useState(hackathon.max_team_size || 4);
  const [prizes, setPrizes] = useState(hackathon.prizes?.length > 0 ? hackathon.prizes : [{ place: '', amount: '', description: '' }]);
  const [rules, setRules] = useState(hackathon.rules || '');
  const [status, setStatus] = useState(hackathon.status);
  const [twitterUrl, setTwitterUrl] = useState(hackathon.twitter_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(hackathon.linkedin_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(hackathon.website_url || '');
  const [communityUrl, setCommunityUrl] = useState(hackathon.community_url || '');
  const [communityType, setCommunityType] = useState(hackathon.community_type || 'slack');

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
      toast.error('Title, description, and category are required');
      return;
    }

    if (!regStart || !regEnd || !eventStart || !eventEnd || !submissionDeadline) {
      toast.error('All date fields are required');
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
        status,
        twitter_url: twitterUrl || null,
        linkedin_url: linkedinUrl || null,
        website_url: websiteUrl || null,
        community_url: communityUrl || null,
        community_type: communityUrl ? communityType : null
      };

      await hackathonAPI.update(hackathon.id, data);
      toast.success('Hackathon updated successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update hackathon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-950 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="sticky top-0 bg-gray-950 border-b border-gray-800 p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold gradient-text">Edit Hackathon</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Hackathon Title *</Label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                placeholder="Enter hackathon title"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-gray-400 mb-2 block">Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white min-h-24"
                placeholder="Describe your hackathon..."
                required
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
                  />
                </TabsContent>
                <TabsContent value="upload" className="mt-3">
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/*"
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
                  <img src={coverImage} alt="Banner preview" className="w-full h-40 object-cover" onError={(e) => e.target.style.display = 'none'} />
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
                required
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
                required
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Registration End *</Label>
              <Input
                type="datetime-local"
                value={regEnd}
                onChange={(e) => setRegEnd(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Event Start *</Label>
              <Input
                type="datetime-local"
                value={eventStart}
                onChange={(e) => setEventStart(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Event End *</Label>
              <Input
                type="datetime-local"
                value={eventEnd}
                onChange={(e) => setEventEnd(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Submission Deadline *</Label>
              <Input
                type="datetime-local"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="bg-gray-900/50 border-gray-800 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Team Size (Min-Max) *</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={minTeamSize}
                  onChange={(e) => setMinTeamSize(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Min (1)"
                  required
                />
                <Input
                  type="number"
                  min="1"
                  max="4"
                  value={maxTeamSize}
                  onChange={(e) => setMaxTeamSize(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder="Max (4)"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Range: 1-4 members per team</p>
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
                  className="border-gray-700 text-gray-400 w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Prize
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-gray-400 mb-2 block">Rules & Guidelines</Label>
            <Textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="bg-gray-900/50 border-gray-800 text-white min-h-24"
              placeholder="Enter hackathon rules..."
            />
          </div>

          <div>
            <Label className="text-gray-400 mb-2 block">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-gray-900/50 border border-gray-800 text-white rounded-lg px-4 py-2"
            >
              <option value="pending_approval">Pending Approval</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Social Profiles & Community Section */}
          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-teal-500" />
              Social Links & Community
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
                    <RadioGroupItem value="slack" id="edit-slack" />
                    <Label htmlFor="edit-slack" className="text-gray-300 cursor-pointer">Slack</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="discord" id="edit-discord" />
                    <Label htmlFor="edit-discord" className="text-gray-300 cursor-pointer">Discord</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="edit-other" />
                    <Label htmlFor="edit-other" className="text-gray-300 cursor-pointer">Other</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="md:col-span-2">
                <Label className="text-gray-400 mb-2 block flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-teal-500" />
                  Community URL
                </Label>
                <Input
                  type="url"
                  value={communityUrl}
                  onChange={(e) => setCommunityUrl(e.target.value)}
                  className="bg-gray-900/50 border-gray-800 text-white"
                  placeholder={communityType === 'slack' ? 'https://yourworkspace.slack.com/...' : communityType === 'discord' ? 'https://discord.gg/...' : 'https://community-link.com'}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-gray-400"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {loading ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}