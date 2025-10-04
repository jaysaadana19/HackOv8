import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  processSession: (sessionId) => api.post('/auth/session', {}, { headers: { 'X-Session-ID': sessionId } }),
  getCurrentUser: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User APIs
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  getUser: (userId) => api.get(`/users/${userId}`),
};

// Hackathon APIs
export const hackathonAPI = {
  getAll: (params) => api.get('/hackathons', { params }),
  getById: (id) => api.get(`/hackathons/${id}`),
  create: (data) => api.post('/hackathons', data),
  update: (id, data) => api.put(`/hackathons/${id}`, data),
  delete: (id) => api.delete(`/hackathons/${id}`),
  getRegistrations: (id) => api.get(`/hackathons/${id}/registrations`),
  getSubmissions: (id) => api.get(`/hackathons/${id}/submissions`),
  getTeams: (id) => api.get(`/hackathons/${id}/teams`),
  getLeaderboard: (id) => api.get(`/hackathons/${id}/leaderboard`),
};

// Registration APIs
export const registrationAPI = {
  register: (hackathonId, teamId) => api.post('/registrations', null, { params: { hackathon_id: hackathonId, team_id: teamId } }),
  getMyRegistrations: () => api.get('/registrations/my'),
};

// Team APIs
export const teamAPI = {
  create: (data) => api.post('/teams', data),
  join: (inviteCode) => api.post('/teams/join', null, { params: { invite_code: inviteCode } }),
  getMy: () => api.get('/teams/my'),
};

// Submission APIs
export const submissionAPI = {
  create: (data) => api.post('/submissions', data),
  getTeamSubmission: (teamId, hackathonId) => api.get(`/teams/${teamId}/submission`, { params: { hackathon_id: hackathonId } }),
};

// Judge APIs
export const judgeAPI = {
  assign: (hackathonId, judgeUserId) => api.post('/judges/assign', null, { params: { hackathon_id: hackathonId, judge_user_id: judgeUserId } }),
  submitScore: (data) => api.post('/scores', data),
  getSubmissionScores: (submissionId) => api.get(`/submissions/${submissionId}/scores`),
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// Admin APIs
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, null, { params: { new_role: role } }),
  exportUsers: () => api.get('/admin/export/users', { responseType: 'blob' }),
  exportHackathons: () => api.get('/admin/export/hackathons', { responseType: 'blob' }),
};
