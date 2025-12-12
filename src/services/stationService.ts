import { api } from './api';
import { type Station, type CreateStationDto, type UpdateStationDto } from '../types';

export const getStations = async () => {
  const response = await api.get<Station[]>('/stations');
  return response.data;
};

export const getStation = async (id: string) => {
  const response = await api.get<Station>(`/stations/${id}`);
  return response.data;
};

export const createStation = async (data: CreateStationDto) => {
  const response = await api.post<Station>('/stations', data);
  return response.data;
};

export const updateStation = async (id: string, data: UpdateStationDto) => {
  const response = await api.patch<Station>(`/stations/${id}`, data);
  return response.data;
};

export const deleteStation = async (id: string) => {
  await api.delete(`/stations/${id}`);
};
