import React, { useState } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { hackathonAPI, uploadAPI } from '@/lib/api';

export default function EditHackathonModal({ hackathon, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState(hackathon.title);
  const [description, setDescription] = useState(hackathon.description);
  const [coverImage, setCoverImage] = useState(hackathon.cover_image || '');
  const [imageMode, setImageMode] = useState('url');
  const [rules, setRules] = useState(hackathon.rules || '');
  const [status, setStatus] = useState(hackathon.status);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const imageUrl = process.env.REACT_APP_BACKEND_URL + response.data.url;
      setCoverImage(imageUrl);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

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
        cover_image: coverImage,
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
                    className="bg-gray-900/50 border-gray-800 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700"
                    disabled={uploading}
                  />
                  {uploading && <div className="loading-spinner"></div>}
                </div>
                <p className="text-xs text-gray-500 mt-2">Max 5MB • JPG, PNG, WebP, GIF</p>
              </TabsContent>
            </Tabs>
            {coverImage && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-800">
                <img src={coverImage} alt="Banner preview" className="w-full h-40 object-cover" onError={(e) => e.target.style.display = 'none'} />
              </div>
            )}
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
