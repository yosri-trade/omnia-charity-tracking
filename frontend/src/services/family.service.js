import api from './api.js';

export async function getAllFamilies() {
  const { data } = await api.get('/families');
  return data;
}

export async function getFamilyById(id) {
  const { data } = await api.get(`/families/${id}`);
  return data;
}

export async function createFamily(familyData) {
  const { data } = await api.post('/families', familyData);
  return data;
}

export async function updateFamily(id, familyData) {
  const { data } = await api.put(`/families/${id}`, familyData);
  return data;
}

export async function deleteFamily(id) {
  const { data } = await api.delete(`/families/${id}`);
  return data;
}
