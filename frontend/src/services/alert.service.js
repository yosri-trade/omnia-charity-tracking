import api from './api.js';

export async function getAlerts() {
  const { data } = await api.get('/alerts');
  return data;
}
