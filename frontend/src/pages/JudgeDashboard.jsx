import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, ArrowLeft, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function JudgeDashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <nav className="border-b border-gray-900 bg-gray-950/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Rocket className="w-6 h-6 text-purple-500" />
          <span className="text-xl font-bold gradient-text">Judge Dashboard</span>
        </div>
      </nav>
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-4">Judge <span className="gradient-text">Dashboard</span></h1>
        <p className="text-gray-400">Review and score submissions</p>
      </div>
    </div>
  );
}
