import api from './axios';

export const getSchedules  = ()           => api.get('/schedules');
export const createSchedule = (data)      => api.post('/schedules', data);
export const updateSchedule = (id, data)  => api.put(`/schedules/${id}`, data);
export const deleteSchedule = (id)        => api.delete(`/schedules/${id}`);

export const getTodayDoses = ()           => api.get('/doses/today');
export const logDose       = (data)       => api.post('/doses/log', data);
