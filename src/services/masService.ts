import { api } from './api';

export interface MASHealthStatus {
  status: string;
  service: string;
  workers: string[];
  modes: string[];
  timestamp: string;
}

export const getMASHealth = async (): Promise<MASHealthStatus> => {
  const response = await api.get<MASHealthStatus>('/roster/health');
  return response.data;
};
