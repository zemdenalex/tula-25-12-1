import axios, { AxiosError } from 'axios';
import type { 
  Place, PlaceCreateData, PlaceTypes, User, UserCreateData, 
  UserLoginData, UserReviewData, SearchFilters, ReviewRankData,
  AdminCreateData, AdminLoginData, AdminUpdateUserData,
  AdminVerifyPlaceData, AdminDeleteReviewData
} from '../types';

// Use proxy in dev, direct URL in production
const API_BASE = import.meta.env.DEV ? '/api' : 'http://85.198.80.80:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Handle 418 "I'm a teapot" as empty data (backend returns this when no data)
const handleResponse = <T>(promise: Promise<{ data: T }>): Promise<T> => {
  return promise
    .then(res => res.data)
    .catch((error: AxiosError) => {
      if (error.response?.status === 418) {
        // Backend returns 418 when no data - treat as empty
        return [] as unknown as T;
      }
      throw error;
    });
};

// Places API
export const placesApi = {
  getAll: (): Promise<Place[]> => {
    return handleResponse(api.get<Place[]>('/place/'));
  },

  getById: (id: number): Promise<Place> => {
    return handleResponse(api.get<Place>(`/place/point/${id}`));
  },

  search: (filters: SearchFilters): Promise<Place[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    return handleResponse(api.get<Place[]>(`/place/search?${params.toString()}`));
  },

  create: (place: PlaceCreateData): Promise<number> => {
    return handleResponse(api.post<number>('/place/', place));
  },

  update: (id: number, place: PlaceCreateData): Promise<void> => {
    return handleResponse(api.post(`/place/change/${id}`, place));
  },

  getTypes: (): Promise<PlaceTypes> => {
    return handleResponse(api.get<PlaceTypes>('/place/types'));
  },
};

// Users API
export const usersApi = {
  create: (userData: UserCreateData): Promise<{ user_id: number }> => {
    return handleResponse(api.post<{ user_id: number }>('/user/create', userData));
  },

  login: (loginData: UserLoginData): Promise<{ user_id: number }> => {
    return handleResponse(api.post<{ user_id: number }>('/user/login', loginData));
  },

  getById: (id: number): Promise<User> => {
    return handleResponse(api.get<User>(`/user/${id}`));
  },

  getAll: (): Promise<User[]> => {
    return handleResponse(api.get<User[]>('/user/'));
  },
};

// Reviews API
export const reviewsApi = {
  add: (review: UserReviewData): Promise<void> => {
    return handleResponse(api.post('/user/review', review));
  },

  delete: (userId: number, reviewId: number): Promise<void> => {
    return handleResponse(api.delete('/user/review', {
      data: { user_id: userId, review_id: reviewId },
    }));
  },

  setRank: (data: ReviewRankData): Promise<void> => {
    return handleResponse(api.post('/review/rank', data));
  },
};

// Photo API
export const photoApi = {
  upload: async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const response = await api.post<{ url: string }>('/photo/upload', arrayBuffer, {
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
    });
    return response.data.url;
  },
};

// Admin API
export const adminApi = {
  create: (data: AdminCreateData): Promise<{ id: number }> => {
    return handleResponse(api.post<{ id: number }>('/admin/create', data));
  },

  login: (data: AdminLoginData): Promise<{ id: number }> => {
    return handleResponse(api.post<{ id: number }>('/admin/login', data));
  },

  updateUserRating: (data: AdminUpdateUserData): Promise<void> => {
    return handleResponse(api.put('/admin/user', data));
  },

  verifyPlace: (data: AdminVerifyPlaceData): Promise<void> => {
    return handleResponse(api.put('/admin/place', data));
  },

  banUser: (userId: number): Promise<void> => {
    return handleResponse(api.delete(`/admin/user/${userId}`));
  },

  deleteReview: (data: AdminDeleteReviewData): Promise<void> => {
    return handleResponse(api.delete('/admin/review', { data }));
  },
};

export default api;
