import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token && config.url?.startsWith('/admin')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      window.location.pathname.startsWith('/admin') &&
      window.location.pathname !== '/admin/login'
    ) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const getSessions = () => api.get('/sessions');
export const getSession = (id) => api.get(`/sessions/${id}`);
export const createBooking = (data) => api.post('/bookings', data);
export const validatePayment = (id, lastName) =>
  api.patch(`/bookings/${id}/validate`, { last_name: lastName });

export const adminLogin = (password) => api.post('/admin/login', { password });
export const getAdminSessions = () => api.get('/admin/sessions');
export const createSession = (data) => api.post('/admin/sessions', data);
export const updateSession = (id, data) => api.put(`/admin/sessions/${id}`, data);
export const deleteSession = (id) => api.delete(`/admin/sessions/${id}`);
export const getSessionBookings = (id) => api.get(`/admin/sessions/${id}/bookings`);
export const updateBooking = (id, data) => api.patch(`/admin/bookings/${id}`, data);
export const deleteBooking = (id) => api.delete(`/admin/bookings/${id}`);

export default api;
