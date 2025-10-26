import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, Download, Share2, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { certificateAPI } from '@/lib/api';

export default function MyCertificate() {
  const { hackathonSlug } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [certificate, setCertificate] = useState(null);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      toast.error('Please enter both name and email');
      return;
    }

    // Get hackathon ID from slug (you'll need to fetch this)
    // For now, assuming we have hackathon data
    const hackathonId = localStorage.getItem(`hackathon_${hackathonSlug}_id`);
    
    if (!hackathonId) {
      toast.error('Invalid hackathon. Please visit from hackathon page.');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const response = await certificateAPI.retrieve(name, email, hackathonId);
      setCertificate(response.data);
      toast.success('Certificate found!');
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('Certificate not found. Please check your name and email.');
      } else {
        toast.error('Failed to retrieve certificate');
      }
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    
    const link = document.createElement('a');
    link.href = process.env.REACT_APP_BACKEND_URL + certificate.certificate_url;
    link.download = `Certificate_${certificate.certificate_id}.png`;
    link.click();
    
    toast.success('Certificate downloaded!');
  };

  const handleShareLinkedIn = () => {
    if (!certificate) return;
    
    const certUrl = `${window.location.origin}/verify-certificate/${certificate.certificate_id}`;
    const text = `I'm proud to share that I've earned a certificate from ${hackathon?.title || 'Hackov8'}!`;
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(certUrl)}&summary=${encodeURIComponent(text)}`;
    
    window.open(linkedinUrl, '_blank', 'width=600,height=600');
  };

  const handleShareTwitter = () => {
    if (!certificate) return;
    
    const certUrl = `${window.location.origin}/verify-certificate/${certificate.certificate_id}`;
    const text = `I've earned a certificate from ${hackathon?.title || 'Hackov8'}! 🎉\n\nVerify it here:`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(certUrl)}`;
    
    window.open(twitterUrl, '_blank', 'width=600,height=600');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">Hackov8</span>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="border-gray-700 text-gray-300">
              Back to Home
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Search Form */}
          <Card className="glass-effect p-8 border border-gray-800 mb-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Get Your Certificate</h1>
              <p className="text-gray-400">Enter your details to retrieve your certificate</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find My Certificate
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Certificate Display */}
          {certificate && (
            <Card className="glass-effect p-8 border border-gray-800">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-green-900/20 border border-green-700/30 rounded-full mb-4">
                  <span className="text-green-400 text-sm font-medium">✓ Certificate Found</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{certificate.user_name}</h2>
                <p className="text-gray-400 capitalize">{certificate.role} Certificate</p>
                <p className="text-gray-500 text-sm mt-1">
                  Issued: {new Date(certificate.issued_date).toLocaleDateString()}
                </p>
                <p className="text-teal-400 text-sm font-mono mt-1">
                  ID: {certificate.certificate_id}
                </p>
              </div>

              {/* Certificate Image */}
              <div className="mb-6 rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={process.env.REACT_APP_BACKEND_URL + certificate.certificate_url}
                  alt="Certificate"
                  className="w-full h-auto"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  onClick={handleDownload}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                <Button
                  onClick={handleShareLinkedIn}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on LinkedIn
                </Button>

                <Button
                  onClick={handleShareTwitter}
                  className="bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share on Twitter
                </Button>
              </div>

              {/* Verification Link */}
              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-400 mb-2">Share this verification link:</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/verify-certificate/${certificate.certificate_id}`}
                    readOnly
                    className="bg-gray-800 border-gray-700 text-gray-300 text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/verify-certificate/${certificate.certificate_id}`);
                      toast.success('Link copied!');
                    }}
                    variant="outline"
                    className="border-gray-700"
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Not Found Message */}
          {searched && !certificate && !loading && (
            <Card className="glass-effect p-8 border border-gray-800 text-center">
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Certificate Not Found</h3>
              <p className="text-gray-400 mb-4">
                We couldn't find a certificate with the provided details.
              </p>
              <p className="text-gray-500 text-sm">
                Please check your name and email, or contact the organizer if you believe this is an error.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
