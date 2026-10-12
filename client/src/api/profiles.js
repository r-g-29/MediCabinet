import api from './axios';

export const getProfiles = () => api.get('/profiles');
export const createProfile = (data) => api.post('/profiles', data);
export const updateProfile = (id, data) => api.put(`/profiles/${id}`, data);
export const deleteProfile = (id) => api.delete(`/profiles/${id}`);
