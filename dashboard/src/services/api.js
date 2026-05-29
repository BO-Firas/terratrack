import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Instance axios avec base URL et timeout
const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

// Intercepteur de requete : injecter le token JWT automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de reponse : deconnecter automatiquement si token invalide
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirection seulement si on n'est pas deja sur /login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============ Endpoints groupes par ressource ============

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const agentsAPI = {
  list: () => api.get('/agents'),
  get: (id) => api.get(`/agents/${id}`),
  getLive: () => api.get('/agents/live'),
  getTrack: (id, date) => api.get(`/agents/${id}/track`, { params: { date } }),
  update: (id, data) => api.put(`/agents/${id}`, data),
};

export const clientsAPI = {
  list: (params) => api.get('/clients', { params }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  remove: (id) => api.delete(`/clients/${id}`),
};

export const zonesAPI = {
  list: () => api.get('/zones'),
  get: (id) => api.get(`/zones/${id}`),
  create: (data) => api.post('/zones', data),
  update: (id, data) => api.put(`/zones/${id}`, data),
  remove: (id) => api.delete(`/zones/${id}`),
};

export const visitsAPI = {
  list: (params) => api.get('/visits', { params }),
  today: () => api.get('/visits/today'),
};

export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  resolveAll: () => api.put('/alerts/resolve-all'),
};

export const statsAPI = {
  me: () => api.get('/stats/me'),
  agent: (id) => api.get(`/stats/agent/${id}`),
  overview: () => api.get('/stats/overview'),
};

export const usersAPI = {
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, password) => api.put(`/users/${id}/password`, { password }),
  toggle: (id) => api.put(`/users/${id}/toggle`),
  remove: (id) => api.delete(`/users/${id}`),
};

export const reportsAPI = {
  daily: (agentId, date) => api.get('/reports/daily', { params: { agent: agentId, date } }),
  period: (agentId, start, end) => api.get('/reports/period', { params: { agent: agentId, start, end } }),
};