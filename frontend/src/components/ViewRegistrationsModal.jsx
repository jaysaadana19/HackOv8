import React, { useEffect, useState } from 'react';
import { X, Download, Users, Mail, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, userAPI } from '@/lib/api';

export default function ViewRegistrationsModal({ hackathon, onClose }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const response = await hackathonAPI.getRegistrations(hackathon.id);
      setRegistrations(response.data);

      // Fetch user details for each registration
      const userPromises = response.data.map(reg => 
        userAPI.getUser(reg.user_id).catch(() => ({ data: { name: 'Unknown', email: 'N/A' } }))
      );
      const users = await Promise.all(userPromises);
      
      const userMap = {};
      response.data.forEach((reg, idx) => {
        userMap[reg.user_id] = users[idx].data;
      });
      setUserDetails(userMap);
    } catch (error) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Registration Date', 'Status'];
    const rows = registrations.map(reg => {
      const user = userDetails[reg.user_id] || {};
      return [
        user.name || 'Unknown',
        user.email || 'N/A',
        new Date(reg.registered_at).toLocaleDateString(),
        reg.status
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${hackathon.title.replace(/\\s+/g, '_')}_registrations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('CSV downloaded successfully!');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="glass-effect rounded-2xl max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 sm:p-8 border-b border-gray-800/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Registrations</h2>
            <p className="text-gray-400 text-sm mt-1 truncate max-w-xs sm:max-w-none">{hackathon.title}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={handleDownloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2"
              disabled={registrations.length === 0}
              data-testid="download-csv-btn"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download </span>CSV
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="loading-spinner"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No registrations yet</h3>
            <p className="text-gray-400">Participants will appear here once they register</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-3xl font-bold gradient-text">{registrations.length}</div>
                  <div className="text-sm text-gray-400">Total Registrations</div>
                </div>
                <div className="h-12 w-px bg-gray-700"></div>
                <div>
                  <div className="text-3xl font-bold gradient-text">
                    {registrations.filter(r => r.status === 'registered').length}
                  </div>
                  <div className="text-sm text-gray-400">Active</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">#</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Participant</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Email</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Registered</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, idx) => {
                    const user = userDetails[reg.user_id] || {};
                    return (
                      <tr key={reg.id} className="border-b border-gray-800/50 hover:bg-gray-900/30" data-testid={`registration-row-${idx}`}>
                        <td className="py-4 px-4 text-gray-400">{idx + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-white">{user.name || 'Unknown'}</div>
                              {user.role && (
                                <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span>{user.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{new Date(reg.registered_at).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge className={`status-badge ${reg.status === 'registered' ? 'status-live' : 'status-completed'}`}>
                            {reg.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
