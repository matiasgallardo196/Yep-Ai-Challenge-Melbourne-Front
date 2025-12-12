import { api } from './api';
import { type SchedulePeriod } from '../types';

export interface CreateSchedulePeriodDto {
  storeId: string;
  startDate: string;
  endDate: string;
  periodType: 'NORMAL' | 'PEAK';
}

export interface UpdateSchedulePeriodDto extends Partial<CreateSchedulePeriodDto> {}

export const getSchedulePeriods = async () => {
  const response = await api.get<SchedulePeriod[]>('/schedule-periods');
  return response.data;
};

export const getSchedulePeriod = async (id: string) => {
  const response = await api.get<SchedulePeriod>(`/schedule-periods/${id}`);
  return response.data;
};

export const createSchedulePeriod = async (data: CreateSchedulePeriodDto) => {
  const response = await api.post<SchedulePeriod>('/schedule-periods', data);
  return response.data;
};

export const updateSchedulePeriod = async (id: string, data: UpdateSchedulePeriodDto) => {
  const response = await api.patch<SchedulePeriod>(`/schedule-periods/${id}`, data);
  return response.data;
};

export const deleteSchedulePeriod = async (id: string) => {
  await api.delete(`/schedule-periods/${id}`);
};
