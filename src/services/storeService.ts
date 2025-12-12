import { api } from './api';
import { type Store, type CreateStoreDto, type UpdateStoreDto } from '../types';

export const getStores = async () => {
  const response = await api.get<Store[]>('/stores');
  return response.data;
};

export const getStore = async (id: string) => {
  const response = await api.get<Store>(`/stores/${id}`);
  return response.data;
};

export const createStore = async (data: CreateStoreDto) => {
  const response = await api.post<Store>('/stores', data);
  return response.data;
};

export const updateStore = async (id: string, data: UpdateStoreDto) => {
  const response = await api.patch<Store>(`/stores/${id}`, data);
  return response.data;
};

export const deleteStore = async (id: string) => {
  await api.delete(`/stores/${id}`);
};
