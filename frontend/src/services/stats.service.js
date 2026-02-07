import api from './api.js';

export async function getStats() {
  const { data } = await api.get('/stats');
  return data;
}
