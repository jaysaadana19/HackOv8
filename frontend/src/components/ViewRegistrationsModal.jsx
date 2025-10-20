import React, { useEffect, useState, useMemo } from 'react';
import { X, Download, Users, Mail, Calendar, User, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { hackathonAPI, userAPI } from '@/lib/api';

export default function ViewRegistrationsModal({ hackathon, onClose }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter and search registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter(reg => {
      const user = userDetails[reg.user_id] || {};
      const matchesSearch = searchTerm === '' || 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [registrations, userDetails, searchTerm, statusFilter]);

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
    // Create CSV content from filtered results
    const headers = ['Name', 'Email', 'Registration Date', 'Status'];
    const dataToExport = filteredRegistrations.length > 0 ? filteredRegistrations : registrations;
    const rows = dataToExport.map(reg => {
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
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `${hackathon.title.replace(/\s+/g, '_')}_registrations${searchTerm ? '_filtered' : ''}.csv`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success(`CSV downloaded! (${dataToExport.length} registration${dataToExport.length !== 1 ? 's' : ''})`);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="glass-effect rounded-none sm:rounded-2xl w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[90vh] flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 lg:p-8 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm">
          <div className="min-w-0 flex-1 mr-4">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">Registrations</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 truncate">{hackathon.title}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleDownloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm px-2 py-2 sm:px-3 sm:py-2 lg:px-4"
              disabled={registrations.length === 0}
              data-testid="download-csv-btn"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 lg:mr-2" />
              <span className="hidden sm:inline">CSV</span>
            </Button>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-2">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        {!loading && registrations.length > 0 && (
          <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-gray-800/30 bg-gray-900/50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-teal-500 text-sm h-9 sm:h-10"
                />
              </div>
              <div className="flex gap-2">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 sm:px-3 py-2 bg-gray-900/50 border border-gray-700 text-white text-xs sm:text-sm rounded-md focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="registered">Registered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {(searchTerm || statusFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-2 sm:px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {filteredRegistrations.length !== registrations.length && (
              <div className="mt-2 text-xs text-gray-400">
                Showing {filteredRegistrations.length} of {registrations.length} registrations
              </div>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-3 border-purple-300 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          ) : filteredRegistrations.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                {registrations.length === 0 ? 'No registrations yet' : 'No matching registrations'}
              </h3>
              <p className="text-gray-400">
                {registrations.length === 0 
                  ? 'Participants will appear here once they register'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {filteredRegistrations.length === 0 && registrations.length > 0 && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-4 text-teal-400 hover:text-teal-300 text-sm underline"
                >
                  Show all registrations
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Stats Section - Fixed at top of content */}
              <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 mb-6 p-4 rounded-lg border border-teal-800/30">
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-6">
                  <div className="text-center sm:text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-teal-400">
                      {filteredRegistrations.length}
                      {filteredRegistrations.length !== registrations.length && (
                        <span className="text-base text-gray-400">/{registrations.length}</span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      {filteredRegistrations.length !== registrations.length ? 'Filtered' : 'Total'} Registrations
                    </div>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-gray-700"></div>
                  <div className="text-center sm:text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-teal-400">
                      {filteredRegistrations.filter(r => r.status === 'registered').length}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Active</div>
                  </div>
                  <div className="hidden sm:block h-12 w-px bg-gray-700"></div>
                  <div className="text-center sm:text-left col-span-2 sm:col-span-1">
                    <div className="text-xs text-gray-400 mb-1">Export ready • CSV format</div>
                    <div className="text-xs text-green-400">✓ {filteredRegistrations.length} records available</div>
                  </div>
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-24 bg-gray-900/95 backdrop-blur-sm z-10">
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-gray-400 font-semibold text-xs sm:text-sm">#</th>
                      <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-gray-400 font-semibold text-xs sm:text-sm">Participant</th>
                      <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-gray-400 font-semibold text-xs sm:text-sm hidden sm:table-cell">Email</th>
                      <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-gray-400 font-semibold text-xs sm:text-sm">Registered</th>
                      <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-gray-400 font-semibold text-xs sm:text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg, idx) => {
                      const user = userDetails[reg.user_id] || {};
                      return (
                        <tr key={reg.id} className="border-b border-gray-800/50 hover:bg-gray-900/30 transition-colors" data-testid={`registration-row-${idx}`}>
                          <td className="py-3 px-2 sm:py-4 sm:px-4 text-gray-400 text-sm">{idx + 1}</td>
                          <td className="py-3 px-2 sm:py-4 sm:px-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-white text-sm truncate">{user.name || 'Unknown'}</div>
                                <div className="text-xs text-gray-500 sm:hidden truncate">{user.email || 'N/A'}</div>
                                {user.role && (
                                  <div className="text-xs text-gray-500 capitalize">{user.role}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:py-4 sm:px-4 hidden sm:table-cell">
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              <span className="truncate">{user.email || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:py-4 sm:px-4">
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                              <span className="text-xs sm:text-sm">{new Date(reg.registered_at).toLocaleDateString()}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 sm:py-4 sm:px-4">
                            <Badge className={`text-xs ${reg.status === 'registered' ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-gray-900/50 text-gray-300 border-gray-700'}`}>
                              {reg.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Scroll Indicator */}
              <div className="text-center py-4 text-xs text-gray-500">
                Showing {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? 's' : ''}
                {filteredRegistrations.length !== registrations.length && (
                  <span className="text-gray-400"> (filtered from {registrations.length} total)</span>
                )}
                {registrations.length >= 100 && (
                  <div className="mt-1 text-teal-400">
                    💡 Tip: Use search/filter and Download CSV for better data management
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
