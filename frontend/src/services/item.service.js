import api from './api.js';

export async function getAllItems() {
  const { data } = await api.get('/items');
  return data;
}

export async function createItem(itemData) {
  const { data } = await api.post('/items', itemData);
  return data;
}

export async function updateStock(id, delta) {
  const { data } = await api.patch(`/items/${id}/stock`, { delta });
  return data;
}

export async function deleteItem(id) {
  const { data } = await api.delete(`/items/${id}`);
  return data;
}
