import { api } from './api';
import { type EmployeeAvailability } from '../types';

export interface CreateAvailabilityDto {
  employeeId: string;
  schedulePeriodId: string;
  storeId: string;
  date: string;
  shiftCodeId: string;
  stationId?: string;
  notes?: string;
}

export interface UpdateAvailabilityDto extends Partial<CreateAvailabilityDto> {}

export const getAvailabilities = async () => {
  const response = await api.get<EmployeeAvailability[]>('/employee-availability');
  return response.data;
};

export const getAvailability = async (id: string) => {
  const response = await api.get<EmployeeAvailability>(`/employee-availability/${id}`);
  return response.data;
};

export const createAvailability = async (data: CreateAvailabilityDto) => {
  const response = await api.post<EmployeeAvailability>('/employee-availability', data);
  return response.data;
};

export const updateAvailability = async (id: string, data: UpdateAvailabilityDto) => {
  const response = await api.patch<EmployeeAvailability>(`/employee-availability/${id}`, data);
  return response.data;
};

export const deleteAvailability = async (id: string) => {
  await api.delete(`/employee-availability/${id}`);
};
