import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { certificateAPI } from '@/lib/api';

export default function VerifyCertificate() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (certificateId) {
      verifyCertificate();
    }
  }, [certificateId]);

  const verifyCertificate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await certificateAPI.verify(certificateId);
      setCertificate(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Certificate not found or invalid');
    } finally {
      setLoading(false);
    }
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
          {/* Loading State */}
          {loading && (
            <Card className="glass-effect p-12 border border-gray-800 text-center">
              <Loader2 className="w-16 h-16 text-teal-400 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Certificate</h2>
              <p className="text-gray-400">Please wait while we verify the certificate...</p>
            </Card>
          )}

          {/* Valid Certificate */}
          {!loading && certificate && (
            <Card className="glass-effect p-8 border border-gray-800">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-500/50">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Certificate Verified ✓</h1>
                <p className="text-gray-400">This certificate is authentic and valid</p>
              </div>

              {/* Certificate Details */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Certificate ID</p>
                    <p className="text-white font-mono font-semibold">{certificate.certificate_id}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Issued Date</p>
                    <p className="text-white font-semibold">
                      {new Date(certificate.issued_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Recipient</p>
                  <p className="text-white font-semibold text-lg">{certificate.user_name}</p>
                  <p className="text-gray-400 text-sm">{certificate.user_email}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Certificate Type</p>
                    <p className="text-white font-semibold capitalize">{certificate.role}</p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                    <p className="text-gray-400 text-sm mb-1">Event</p>
                    <p className="text-white font-semibold">{certificate.hackathon_name}</p>
                  </div>
                </div>
              </div>

              {/* Certificate Image Preview */}
              {certificate.certificate_url && (
                <div className="mb-6 rounded-lg overflow-hidden border border-gray-700">
                  <img
                    src={process.env.REACT_APP_BACKEND_URL + certificate.certificate_url}
                    alt="Certificate"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Verification Badge */}
              <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-green-300 font-medium">Authentic Certificate</p>
                    <p className="text-green-400/70 text-sm">
                      This certificate has been verified and is legitimate.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Invalid Certificate */}
          {!loading && error && (
            <Card className="glass-effect p-12 border border-red-800/50 text-center">
              <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500/50">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Certificate Not Found</h1>
              <p className="text-gray-400 mb-6">{error}</p>
              
              <div className="bg-red-900/10 border border-red-700/30 rounded-lg p-4 mb-6">
                <p className="text-red-300 text-sm">
                  The certificate ID you're trying to verify doesn't exist in our database or may have been revoked.
                </p>
              </div>

              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="border-gray-700 text-gray-300"
              >
                Go to Homepage
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
