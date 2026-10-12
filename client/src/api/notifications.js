import api from './axios';

export const getNotifications = () => api.get('/notifications');
export const markAsRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => api.patch('/notifications/read-all');
export const runAlerts = () => api.post('/dev/run-alerts');
export const sendTestEmail = () => api.post('/notifications/test-email');

