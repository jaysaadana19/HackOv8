import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Twitter, Linkedin, Github, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-xl mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Hackov8</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The ultimate platform where developers, designers, and innovators collaborate to create groundbreaking solutions.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Users</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                  Browse Hackathons
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/settings" className="text-gray-400 hover:text-teal-500 transition-colors text-sm">
                  Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex gap-3 mb-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
              >
                <Linkedin className="w-4 h-4 text-white" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
              >
                <Github className="w-4 h-4 text-white" />
              </a>
              <a
                href="mailto:support@hackov8.com"
                className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-teal-600 flex items-center justify-center transition-colors"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>
            </div>
            <p className="text-gray-400 text-xs">
              Questions? Reach out to us!
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} Hackov8. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-500 hover:text-teal-500 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-teal-500 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
