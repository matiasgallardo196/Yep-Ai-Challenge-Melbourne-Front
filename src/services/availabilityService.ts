import { api } from './api';
import { type EmployeeAvailability } from '../types';

export const getAvailabilities = async () => {
  const response = await api.get<EmployeeAvailability[]>('/employee-availability');
  return response.data;
};
