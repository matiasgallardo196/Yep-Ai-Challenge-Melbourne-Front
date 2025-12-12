import { api } from './api';
import { type RosterGenerationResult } from '../types';

export const generateRoster = async (storeId: string, weekStart: string, mode: 'dynamic' | 'fallback') => {
  const response = await api.post<RosterGenerationResult>('/roster/generate', {
    storeId,
    weekStart,
    mode,
  });
  return response.data;
};
