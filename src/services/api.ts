import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    // Backend returns wrapped response { statusCode: 200, data: [...] }
    // We want to unwrap it so the application gets the data directly
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    // Handle specific error cases (e.g., 401 Unauthorized)
    return Promise.reject(error);
  }
);
