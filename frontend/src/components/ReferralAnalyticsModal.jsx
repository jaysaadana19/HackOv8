import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Users, Share2, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { referralAPI } from '@/lib/api';

export default function ReferralAnalyticsModal({ hackathon, onClose }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await referralAPI.getHackathonAnalytics(hackathon.id);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch referral analytics:', error);
      toast.error('Failed to load referral analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <Card className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading referral analytics...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <Card className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 text-white rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-7 h-7" />
                Referral Analytics
              </h2>
              <p className="text-teal-100 text-sm mt-1">{hackathon.title}</p>
            </div>
            <button 
              onClick={onClose}
              className="text-teal-100 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-700">{analytics?.total_referrals || 0}</p>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{analytics?.total_referrers || 0}</p>
                  <p className="text-sm text-gray-600">Active Referrers</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 p-4 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {analytics?.total_referrals > 0 ? Math.round((analytics.total_referrals / analytics.total_referrers) * 10) / 10 : 0}
                  </p>
                  <p className="text-sm text-gray-600">Avg per Referrer</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Referrers */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Top Referrers</h3>
            {analytics?.top_referrers?.length > 0 ? (
              <div className="space-y-3">
                {analytics.top_referrers.slice(0, 5).map((referrer, index) => (
                  <Card key={referrer.email} className="bg-gray-50 border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-500' : 'bg-teal-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{referrer.name}</p>
                          <p className="text-sm text-gray-600">{referrer.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-teal-600">{referrer.count}</p>
                        <p className="text-xs text-gray-500">referrals</p>
                      </div>
                    </div>
                    {referrer.recent_referrals?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2">Recent referrals:</p>
                        <div className="flex flex-wrap gap-2">
                          {referrer.recent_referrals.slice(0, 3).map((ref, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {ref.user_name} • {formatDate(ref.registered_at)}
                            </Badge>
                          ))}
                          {referrer.recent_referrals.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{referrer.recent_referrals.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No referrals yet</p>
                <p className="text-gray-500 text-sm mt-1">Encourage participants to share their referral links!</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Recent Referral Activity</h3>
            {analytics?.recent_referrals?.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {analytics.recent_referrals.map((referral, index) => (
                  <Card key={index} className="bg-white border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {referral.referred_user_name} joined via {referral.referrer_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {formatDate(referral.registered_at)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {referral.utm_medium || 'direct'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 rounded-b-3xl border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Real-time referral tracking • Updated automatically
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