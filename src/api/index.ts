import axios from 'axios';

const API_BASE = import.meta.env.DEV ? '/api' : 'http://85.198.80.80:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Types
export interface Place {
  id: number;
  name: string;
  type?: string;
  is_moderated?: boolean;
  rating?: number;
  review_rank?: number;
}

export interface User {
  user_id: number;
  name?: string;
  email?: string;
  rating?: number;
}

export interface Review {
  id: number;
  id_user?: number;
  user_name?: string;
  id_place?: number;
  text?: string;
}

// Admin API
export const adminApi = {
  login: async (email: string, pwd: string) => {
    const res = await api.post<{ id: number }>('/admin/login', { email, pwd });
    return res.data;
  },

  create: async (id_invite: number, name: string, email: string, password: string) => {
    const res = await api.post<{ id: number }>('/admin/create', { id_invite, name, email, password });
    return res.data;
  },

  verifyPlace: async (id_place: number, verify: boolean) => {
    await api.put('/admin/place', { id_place, verify });
  },

  updateUserRating: async (id_user: number, rating: number) => {
    await api.put('/admin/user', { id_user, rating });
  },

  banUser: async (userId: number) => {
    await api.delete(`/admin/user/${userId}`);
  },

  deleteReview: async (id_review: number, rating?: number) => {
    await api.delete('/admin/review', { data: { id_review, rating } });
  },
};

// Data API
export const dataApi = {
  getPlaces: async (): Promise<Place[]> => {
    try {
      const res = await api.get<Place[]>('/place/');
      return res.data;
    } catch (e: any) {
      if (e.response?.status === 418) return [];
      throw e;
    }
  },

  getUsers: async (): Promise<User[]> => {
    try {
      const res = await api.get<User[]>('/user/');
      return res.data;
    } catch (e: any) {
      if (e.response?.status === 418) return [];
      throw e;
    }
  },

  getPlaceById: async (id: number) => {
    const res = await api.get(`/place/point/${id}`);
    return res.data;
  },
};
