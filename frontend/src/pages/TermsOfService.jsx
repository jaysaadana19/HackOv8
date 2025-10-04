import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, XCircle, AlertTriangle, Scale, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Footer from '@/components/Footer';

export default function TermsOfService() {
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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-6">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400 text-lg">Last Updated: January 2025</p>
        </div>

        <div className="space-y-8">
          {/* Introduction */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <p className="text-gray-300 leading-relaxed">
              Welcome to Hackov8! These Terms of Service ("Terms") govern your access to and use of the Hackov8 platform, including our website, services, and applications (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
            </p>
          </Card>

          {/* Acceptance of Terms */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-teal-500" />
              <h2 className="text-2xl font-bold text-white">Acceptance of Terms</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                By creating an account, registering for hackathons, or otherwise using Hackov8, you:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acknowledge that you have read and understood these Terms</li>
                <li>Agree to comply with all applicable laws and regulations</li>
                <li>Confirm you are at least 13 years of age (or the legal age in your jurisdiction)</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>
          </Card>

          {/* User Accounts */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-purple-500" />
              <h2 className="text-2xl font-bold text-white">User Accounts and Roles</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Account Registration</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>You must provide accurate and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your password</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                  <li>Email verification is required for account security</li>
                  <li>One person may not maintain multiple accounts</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">User Roles</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Participants:</strong> Can register for hackathons, join teams, and submit projects</li>
                  <li><strong>Organizers:</strong> Can create and manage hackathons, review submissions, and select winners</li>
                  <li><strong>Judges:</strong> Can evaluate and score hackathon submissions</li>
                  <li><strong>Admins:</strong> Platform administrators with full access</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Hackathon Rules */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Scale className="w-6 h-6 text-teal-500" />
              <h2 className="text-2xl font-bold text-white">Hackathon Participation Rules</h2>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">For Participants</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Follow all rules and guidelines set by hackathon organizers</li>
                  <li>Submit original work created during the hackathon period</li>
                  <li>Respect intellectual property rights of others</li>
                  <li>Work within designated team size limits (1-4 members)</li>
                  <li>Communicate respectfully with team members, organizers, and judges</li>
                  <li>Do not engage in cheating, plagiarism, or other dishonest behavior</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">For Organizers</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide clear and accurate hackathon information</li>
                  <li>Treat all participants fairly and without discrimination</li>
                  <li>Honor commitments regarding prizes and recognition</li>
                  <li>Respect participant privacy and data</li>
                  <li>Resolve disputes fairly and transparently</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Intellectual Property */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property Rights</h2>
            <div className="space-y-4 text-gray-300">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Your Content</h3>
                <p className="leading-relaxed mb-2">
                  You retain all rights to the projects, code, and content you create and submit through Hackov8. By submitting content, you grant us a limited license to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Display your submissions on the platform</li>
                  <li>Share your work with hackathon organizers and judges</li>
                  <li>Showcase winning projects in promotional materials (with your consent)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Platform Content</h3>
                <p className="leading-relaxed">
                  The Hackov8 platform, including its design, features, and content, is protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express permission.
                </p>
              </div>
            </div>
          </Card>

          {/* Prohibited Conduct */}
          <Card className="glass-effect p-8 border border-red-500/30">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-2xl font-bold text-white">Prohibited Conduct</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Spam, phish, or engage in fraudulent activities</li>
                <li>Impersonate others or misrepresent your affiliation</li>
                <li>Scrape or harvest data from the platform without permission</li>
                <li>Interfere with the proper functioning of the Service</li>
                <li>Create fake accounts or manipulate the platform</li>
              </ul>
            </div>
          </Card>

          {/* Disclaimers */}
          <Card className="glass-effect p-8 border border-yellow-500/30">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Disclaimers</h2>
            </div>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed font-semibold text-yellow-400">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>We are not responsible for content posted by users</li>
                <li>Hackathon outcomes, prizes, and decisions are at organizer discretion</li>
                <li>We do not guarantee the accuracy of user-provided information</li>
                <li>Use the platform at your own risk</li>
              </ul>
            </div>
          </Card>

          {/* Limitation of Liability */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                To the maximum extent permitted by law, Hackov8 and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Loss of profits, data, or business opportunities</li>
                <li>Service interruptions or technical issues</li>
                <li>Disputes between users</li>
                <li>Prize disputes or unfulfilled commitments by organizers</li>
                <li>Unauthorized access to your account</li>
              </ul>
            </div>
          </Card>

          {/* Termination */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Termination</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                We reserve the right to suspend or terminate your account at any time, with or without notice, for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Behavior that harms other users or the platform</li>
                <li>Prolonged inactivity</li>
              </ul>
              <p className="leading-relaxed mt-4">
                You may delete your account at any time through your settings page. Upon termination, your access to the Service will cease, but certain provisions of these Terms will survive.
              </p>
            </div>
          </Card>

          {/* Changes to Terms */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                We may modify these Terms at any time. We will notify users of significant changes by posting an announcement on the platform or via email. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </div>
          </Card>

          {/* Governing Law */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Governing Law and Dispute Resolution</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Service shall be resolved through good faith negotiation. If negotiation fails, disputes may be resolved through binding arbitration or in courts of competent jurisdiction.
              </p>
            </div>
          </Card>

          {/* Contact */}
          <Card className="glass-effect p-8 border border-purple-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <div className="space-y-3 text-gray-300">
              <p className="leading-relaxed">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Email:</strong> <a href="mailto:hackov8@gmail.com" className="text-teal-400 hover:text-teal-300 underline">hackov8@gmail.com</a></p>
                <p><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/company/getsocialnow/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline">Hackov8 on LinkedIn</a></p>
              </div>
            </div>
          </Card>

          {/* Acknowledgment */}
          <Card className="glass-effect p-8 border border-teal-500/30">
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-6">
              <p className="text-white leading-relaxed">
                <strong>By using Hackov8, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.</strong>
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
