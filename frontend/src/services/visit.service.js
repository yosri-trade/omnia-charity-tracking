import api from './api.js';

export async function getAllVisits() {
  const { data } = await api.get('/visits');
  return data;
}

export async function getMyVisits() {
  const { data } = await api.get('/visits/my-visits');
  return data;
}

export async function getVisitById(id) {
  const { data } = await api.get(`/visits/${id}`);
  return data;
}

export async function createVisit(payload) {
  const { data: res } = await api.post('/visits', payload);
  return res;
}

export async function getVisitsByFamily(familyId) {
  const { data } = await api.get(`/visits/family/${familyId}`);
  return data;
}

export async function validateVisit(id, { resolveUrgency, location, proofPhoto }) {
  const { data } = await api.patch(`/visits/${id}/validate`, {
    resolveUrgency: resolveUrgency ?? false,
    location: location ?? null,
    proofPhoto: proofPhoto ?? undefined,
  });
  return data;
}
