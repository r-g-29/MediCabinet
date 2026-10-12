import api from './axios';

export const getEmergencyProfile = (profileId) => api.get(`/emergency/${profileId}`);
