import { api } from './api';
import { type Employee, type CreateEmployeeDto, type UpdateEmployeeDto } from '../types';

export const getEmployees = async () => {
  const response = await api.get<Employee[]>('/employees');
  return response.data;
};

export const getEmployee = async (id: string) => {
  const response = await api.get<Employee>(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data: CreateEmployeeDto) => {
  const response = await api.post<Employee>('/employees', data);
  return response.data;
};

export const updateEmployee = async (id: string, data: UpdateEmployeeDto) => {
  const response = await api.patch<Employee>(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id: string) => {
  await api.delete(`/employees/${id}`);
};
