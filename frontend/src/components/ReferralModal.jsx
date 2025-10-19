import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Twitter, Facebook, Linkedin, MessageCircle, CheckCircle, ExternalLink, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { referralAPI } from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';

export default function ReferralModal({ hackathon, onClose }) {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralLink();
  }, []);

  const fetchReferralLink = async () => {
    try {
      const response = await referralAPI.getReferralLink(hackathon.id);
      setReferralData(response.data);
    } catch (error) {
      console.error('Failed to get referral link:', error);
      toast.error('Failed to generate referral link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralData.referral_link);
      setCopied(true);
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const shareToSocial = (platform) => {
    if (!referralData) return;

    const text = `Check out this amazing hackathon: ${hackathon.title}! Join me and let's build something incredible together 🚀`;
    const url = referralData.referral_link;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <Card className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Generating your referral link...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Share2 className="w-7 h-7" />
                Share & Earn
              </h2>
              <p className="text-teal-100 text-sm mt-1">Invite friends to {hackathon.title}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-teal-100 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Referral Link */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Referral Link</h3>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={referralData?.referral_link || ''}
                  readOnly
                  className="pr-12 bg-gray-50 border-gray-300 text-gray-900 font-mono text-sm"
                />
                <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              <Button
                onClick={copyToClipboard}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Share this link and earn recognition when friends register!
            </p>
          </div>

          {/* Social Sharing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Share on Social Media</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                onClick={() => shareToSocial('twitter')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-16 border-blue-200 hover:border-blue-400 hover:bg-blue-50"
              >
                <Twitter className="w-5 h-5 text-blue-500" />
                <span className="text-xs">Twitter</span>
              </Button>
              
              <Button
                onClick={() => shareToSocial('facebook')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-16 border-blue-200 hover:border-blue-600 hover:bg-blue-50"
              >
                <Facebook className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              
              <Button
                onClick={() => shareToSocial('linkedin')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-16 border-blue-200 hover:border-blue-700 hover:bg-blue-50"
              >
                <Linkedin className="w-5 h-5 text-blue-700" />
                <span className="text-xs">LinkedIn</span>
              </Button>
              
              <Button
                onClick={() => shareToSocial('whatsapp')}
                variant="outline"
                className="flex flex-col items-center gap-2 h-16 border-green-200 hover:border-green-500 hover:bg-green-50"
              >
                <MessageCircle className="w-5 h-5 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Referral Code */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Your Referral Code</h3>
            <Card className="bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Your unique referral code:</p>
                  <p className="text-2xl font-bold text-teal-700 font-mono">{referralData?.referral_code}</p>
                </div>
                <div className="text-right">
                  <TrendingUp className="w-8 h-8 text-teal-500 mx-auto mb-1" />
                  <p className="text-xs text-gray-600">Track Progress</p>
                </div>
              </div>
            </Card>
          </div>

          {/* How it Works */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How It Works</h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">1</div>
                <div>
                  <p className="font-semibold text-gray-800">Share your link</p>
                  <p className="text-sm text-gray-600">Send your referral link to friends and colleagues</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">2</div>
                <div>
                  <p className="font-semibold text-gray-800">They register</p>
                  <p className="text-sm text-gray-600">When they click your link and register for the hackathon</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">3</div>
                <div>
                  <p className="font-semibold text-gray-800">Get recognition</p>
                  <p className="text-sm text-gray-600">You'll be notified and get credit for bringing them in!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 rounded-b-3xl border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Start sharing and help grow the community! 🚀
            </p>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}