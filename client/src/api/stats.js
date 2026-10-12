import api from './axios';

export const getStatsSummary = () => api.get('/stats/summary');
export const getStatsAdherence = (days = 30) => api.get(`/stats/adherence?days=${days}`);
export const getStatsWaste = () => api.get('/stats/waste');
