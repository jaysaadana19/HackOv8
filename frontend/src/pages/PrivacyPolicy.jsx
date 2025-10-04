import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-gray-900 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl flex-grow">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400 text-lg">Last Updated: January 2025</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <p className="text-gray-300 leading-relaxed">
              At Hackov8, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our hackathon platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </Card>

          {/* Information We Collect */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-6 h-6 text-teal-500" />
              <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
                <p className="leading-relaxed mb-2">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name and email address</li>
                  <li>Profile information (bio, social media links)</li>
                  <li>Company information (for organizers)</li>
                  <li>Project submissions and hackathon registrations</li>
                  <li>Communication preferences</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Automatically Collected Information</h3>
                <p className="leading-relaxed mb-2">When you access our platform, we automatically collect:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage data (pages visited, time spent, features used)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* How We Use Your Information */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <div className="flex items-center gap-3 mb-6">
              <UserCheck className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-white">How We Use Your Information</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Create and manage your account</li>
                <li>Process hackathon registrations and submissions</li>
                <li>Facilitate communication between participants, organizers, and judges</li>
                <li>Send important notifications about hackathons and platform updates</li>
                <li>Improve our platform and develop new features</li>
                <li>Prevent fraud and ensure platform security</li>
                <li>Comply with legal obligations</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>
            </div>
          </Card>

          {/* Information Sharing */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="w-6 h-6 text-teal-500" />
              <h2 className="text-2xl font-bold text-white">Information Sharing and Disclosure</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">We may share your information in the following situations:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>With Hackathon Organizers:</strong> When you register for a hackathon, your profile information is shared with organizers</li>
                <li><strong>With Team Members:</strong> Your information is visible to your team members during hackathons</li>
                <li><strong>Public Profiles:</strong> Information you choose to make public (name, bio, projects) may be visible to other users</li>
                <li><strong>Service Providers:</strong> We may share data with trusted third-party service providers who assist in operating our platform</li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
              </ul>
              <p className="leading-relaxed mt-4 font-semibold">
                We do not sell your personal information to third parties.
              </p>
            </div>
          </Card>

          {/* Data Security */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-white">Data Security</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication and password hashing</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and monitoring</li>
                <li>Email verification for account security</li>
              </ul>
              <p className="leading-relaxed mt-4 text-yellow-400">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>
          </Card>

          {/* Your Rights */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Eye className="w-6 h-6 text-teal-500" />
              <h2 className="text-2xl font-bold text-white">Your Privacy Rights</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request your data in a machine-readable format</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing</li>
              </ul>
              <p className="leading-relaxed mt-4">
                To exercise these rights, please contact us at <a href="mailto:hackov8@gmail.com" className="text-teal-400 hover:text-teal-300 underline">hackov8@gmail.com</a>
              </p>
            </div>
          </Card>

          {/* Cookies */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking Technologies</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience. Cookies are small data files stored on your device. You can control cookies through your browser settings, but disabling them may affect platform functionality.
              </p>
            </div>
          </Card>

          {/* Children's Privacy */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </div>
          </Card>

          {/* Changes to Policy */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">Changes to This Privacy Policy</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>
          </Card>

          {/* Contact */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> <a href="mailto:hackov8@gmail.com" className="text-teal-400 hover:text-teal-300 underline">hackov8@gmail.com</a></p>
                <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/company/getsocialnow/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline">Hackov8 on LinkedIn</a></p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
