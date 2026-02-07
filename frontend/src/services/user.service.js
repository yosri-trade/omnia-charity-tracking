import api from './api.js';

export async function createUser({ name, email, password, role }) {
  const { data } = await api.post('/users', { name, email, password, role: role || 'VOLUNTEER' });
  return data;
}

export async function getVolunteers() {
  const { data } = await api.get('/users/volunteers');
  return data;
}
