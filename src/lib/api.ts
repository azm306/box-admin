import axios from 'axios';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://fresh-market.buy2all.com/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const productsApi = {
  list: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  stats: () => api.get('/products/stats'),
};

export const categoriesApi = {
  list: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
};
