import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Users, Trophy, Code, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import SEO from '@/components/SEO';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold gradient-text">Hackov8</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6">
            About <span className="gradient-text">Hackov8</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Hackov8 is the ultimate platform for hosting, managing, and participating in hackathons. 
            We streamline the entire hackathon experience from registration to winner announcements.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                icon: Users,
                title: 'For Participants',
                description: 'Join exciting hackathons, form teams, collaborate with innovators, and showcase your projects.'
              },
              {
                icon: Trophy,
                title: 'For Organizers',
                description: 'Create and manage hackathons effortlessly with our comprehensive tools and analytics.'
              },
              {
                icon: Code,
                title: 'For Judges',
                description: 'Review submissions with custom rubrics and provide valuable feedback to participants.'
              },
              {
                icon: TrendingUp,
                title: 'For Growth',
                description: 'Scale your hackathon community with built-in features for engagement and management.'
              }
            ].map((feature, idx) => (
              <Card key={idx} className="glass-effect p-6 hover-lift">
                <feature.icon className="w-10 h-10 text-purple-500 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>

          <div className="glass-effect p-8 rounded-2xl mb-12">
            <h2 className="text-3xl font-bold mb-6 text-white">Why Choose Hackov8?</h2>
            <div className="space-y-6">
              {[
                {
                  icon: Shield,
                  title: 'Secure & Reliable',
                  description: 'Enterprise-grade security with robust data protection and privacy controls.'
                },
                {
                  icon: Zap,
                  title: 'Lightning Fast',
                  description: 'Built for performance with real-time updates and seamless user experience.'
                },
                {
                  icon: Users,
                  title: 'Community Driven',
                  description: 'Connect with thousands of developers, designers, and innovators worldwide.'
                }
              ].map((reason, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <reason.icon className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{reason.title}</h3>
                    <p className="text-gray-400">{reason.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-effect p-8 rounded-2xl">
            <h2 className="text-3xl font-bold mb-6 text-white">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'How do I register for a hackathon?',
                  a: 'Click on any hackathon card, review the details, and click the "Register" button. You\'ll need to create an account first if you haven\'t already.'
                },
                {
                  q: 'Can I participate solo or do I need a team?',
                  a: 'It depends on the hackathon! Some allow solo participants while others require teams. Check the hackathon details for team size requirements.'
                },
                {
                  q: 'How do I create a team?',
                  a: 'After registering for a hackathon, you can create a team and share the invite code with your teammates. They can join using that code.'
                },
                {
                  q: 'How does judging work?',
                  a: 'Judges score submissions based on custom rubrics set by organizers. Scores are averaged to determine winners, and all feedback is shared with teams.'
                },
                {
                  q: 'Can I host my own hackathon?',
                  a: 'Absolutely! Sign up as an Organizer/Company, and you\'ll get access to our comprehensive hackathon creation and management tools.'
                },
                {
                  q: 'Is Hackov8 free to use?',
                  a: 'Yes! Hackov8 is free for participants. Organizers can host hackathons with our flexible pricing plans.'
                }
              ].map((faq, idx) => (
                <div key={idx} className="border-b border-gray-800 last:border-0 pb-6 last:pb-0">
                  <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-gray-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
