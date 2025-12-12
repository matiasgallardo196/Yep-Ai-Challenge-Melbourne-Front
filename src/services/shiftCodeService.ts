import { api } from './api';
import { type ShiftCode, type CreateShiftCodeDto, type UpdateShiftCodeDto } from '../types';

export const getShiftCodes = async () => {
  const response = await api.get<ShiftCode[]>('/shift-codes');
  return response.data;
};

export const getShiftCode = async (id: string) => {
  const response = await api.get<ShiftCode>(`/shift-codes/${id}`);
  return response.data;
};

export const createShiftCode = async (data: CreateShiftCodeDto) => {
  const response = await api.post<ShiftCode>('/shift-codes', data);
  return response.data;
};

export const updateShiftCode = async (id: string, data: UpdateShiftCodeDto) => {
  const response = await api.patch<ShiftCode>(`/shift-codes/${id}`, data);
  return response.data;
};

export const deleteShiftCode = async (id: string) => {
  await api.delete(`/shift-codes/${id}`);
};
