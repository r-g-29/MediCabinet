import api from './axios';

export const getMedicines = (params) => api.get('/medicines', { params });
export const createMedicine = (data) => api.post('/medicines', data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}`, data);
export const deleteMedicine = (id) => api.delete(`/medicines/${id}`);
export const checkDuplicate = (data) => api.post('/medicines/check-duplicate', data);
export const searchReference = (q) => api.get('/reference/search', { params: { q } });
export const scanMedicine = (formData) => api.post('/medicines/scan', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const sendMedicineAlert = (id) => api.post(`/medicines/${id}/send-alert`);

