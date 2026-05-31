import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: API,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

// Response interceptor
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        await api.post('/api/auth/refresh');
        return api(err.config);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export function formatError(detail) {
  if (!detail) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(', ');
  if (detail?.msg) return detail.msg;
  return String(detail);
}

// Auth
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
  verifyEmail: (token) => api.post('/api/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/api/auth/resend-verification', { email }),
};

// Admin
export const adminAPI = {
  getBusinesses: (params) => api.get('/api/admin/businesses', { params }),
  createBusiness: (data) => api.post('/api/admin/businesses', data),
  getBusiness: (id) => api.get(`/api/admin/businesses/${id}`),
  updateBusiness: (id, data) => api.put(`/api/admin/businesses/${id}`, data),
  suspendBusiness: (id) => api.put(`/api/admin/businesses/${id}/suspend`),
  activateBusiness: (id) => api.put(`/api/admin/businesses/${id}/activate`),
  deleteBusiness: (id) => api.delete(`/api/admin/businesses/${id}`),
  getAllLeads: (params) => api.get('/api/admin/leads', { params }),
  getAllAppointments: (params) => api.get('/api/admin/appointments', { params }),
  getAnalytics: () => api.get('/api/admin/analytics'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
};

// Leads
export const leadsAPI = {
  getLeads: (params) => api.get('/api/leads/', { params }),
  createLead: (data) => api.post('/api/leads/', data),
  getLead: (id) => api.get(`/api/leads/${id}`),
  updateLead: (id, data) => api.put(`/api/leads/${id}`, data),
  deleteLead: (id) => api.delete(`/api/leads/${id}`),
  sendVerification: (id) => api.post(`/api/leads/${id}/verify`),
  confirmVerification: (id, code) => api.post(`/api/leads/${id}/verify/confirm`, { code }),
};

// Conversations
export const conversationsAPI = {
  getConversations: (params) => api.get('/api/conversations/', { params }),
  getConversation: (id) => api.get(`/api/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/api/conversations/${id}`),
};

// Appointments
export const appointmentsAPI = {
  getAppointments: (params) => api.get('/api/appointments/', { params }),
  createAppointment: (data) => api.post('/api/appointments/', data),
  getAppointment: (id) => api.get(`/api/appointments/${id}`),
  updateAppointment: (id, data) => api.put(`/api/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/api/appointments/${id}`),
};

// Analytics
export const analyticsAPI = {
  getAnalytics: () => api.get('/api/analytics/'),
};

// Chatbot
export const chatbotAPI = {
  getInfo: (businessId) => api.get(`/api/chatbot/${businessId}/info`),
  sendMessage: (businessId, data) => api.post(`/api/chatbot/${businessId}/message`, data),
  createLead: (businessId, data) => api.post(`/api/chatbot/${businessId}/lead`, data),
};

// Billing
export const billingAPI = {
  getPlans: () => api.get('/api/billing/plans'),
  createCheckout: (data) => api.post('/api/billing/checkout', data),
  getCheckoutStatus: (sessionId) => api.get(`/api/billing/checkout/status/${sessionId}`),
  getTransactions: () => api.get('/api/billing/transactions'),
  getSubscription: () => api.get('/api/billing/subscription'),
};

// Settings
export const settingsAPI = {
  getSettings: () => api.get('/api/settings/'),
  updateSettings: (data) => api.put('/api/settings/', data),
  updateAISettings: (data) => api.put('/api/settings/ai', data),
  updateWorkingHours: (data) => api.put('/api/settings/working-hours', data),
};

// Notifications
export const notificationsAPI = {
  getNotifications: (params) => api.get('/api/notifications/', { params }),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
};

// Integrations
export const integrationsAPI = {
  getIntegrations: () => api.get('/api/integrations/'),
  updateIntegrations: (data) => api.put('/api/integrations/', data),
  testTwilio: () => api.post('/api/integrations/test/twilio'),
  regenerateApiKey: () => api.post('/api/integrations/regenerate-api-key'),
};

export default api;
