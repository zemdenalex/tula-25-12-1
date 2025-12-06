import axios from 'axios';
import type { Place, PlaceCreateData, PlaceTypes, User, UserCreateData, UserLoginData, UserReviewData, SearchFilters } from '../types';

const API_BASE = 'http://85.198.80.80:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const placesApi = {
  getAll: async (): Promise<Place[]> => {
    const { data } = await api.get<Place[]>('/place/');
    return data;
  },

  getById: async (id: number): Promise<Place> => {
    const { data } = await api.get<Place>(`/place/point/${id}`);
    return data;
  },

  search: async (filters: SearchFilters): Promise<Place[]> => {
    const params = new URLSearchParams();
    if (filters.place_type !== undefined) params.append('place_type', String(filters.place_type));
    if (filters.is_alcohol !== undefined) params.append('is_alcohol', String(filters.is_alcohol));
    if (filters.is_health !== undefined) params.append('is_health', String(filters.is_health));
    if (filters.is_nosmoking !== undefined) params.append('is_nosmoking', String(filters.is_nosmoking));
    if (filters.is_smoke !== undefined) params.append('is_smoke', String(filters.is_smoke));
    if (filters.max_distance !== undefined) params.append('max_distance', String(filters.max_distance));
    if (filters.is_moderated !== undefined) params.append('is_moderated', String(filters.is_moderated));
    
    const { data } = await api.get<Place[]>(`/place/search?${params.toString()}`);
    return data;
  },

  create: async (place: PlaceCreateData): Promise<number> => {
    const { data } = await api.post<number>('/place/', place);
    return data;
  },

  update: async (id: number, place: PlaceCreateData): Promise<void> => {
    await api.post(`/place/change/${id}`, place);
  },

  getTypes: async (): Promise<PlaceTypes> => {
    const { data } = await api.get<PlaceTypes>('/place/types');
    return data;
  },
};

export const usersApi = {
  create: async (userData: UserCreateData): Promise<{ user_id: number }> => {
    const { data } = await api.post<{ user_id: number }>('/user/create', userData);
    return data;
  },

  login: async (loginData: UserLoginData): Promise<{ user_id: number }> => {
    const { data } = await api.post<{ user_id: number }>('/user/login', loginData);
    return data;
  },

  getById: async (id: number): Promise<User> => {
    const { data } = await api.get<User>(`/user/${id}`);
    return data;
  },

  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/user/');
    return data;
  },
};

export const reviewsApi = {
  add: async (review: UserReviewData): Promise<void> => {
    await api.post('/user/review', review);
  },

  delete: async (userId: number, reviewId: number): Promise<void> => {
    await api.delete('/user/review', {
      data: { user_id: userId, review_id: reviewId },
    });
  },
};

export default api;
