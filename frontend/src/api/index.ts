import axios, { AxiosError } from 'axios';
import type { 
  Place, PlaceCreateData, PlaceTypes, User, UserCreateData, 
  UserLoginData, UserReviewData, SearchFilters, ReviewRankData,
  AdminCreateData, AdminLoginData, AdminUpdateUserData,
  AdminVerifyPlaceData, AdminDeleteReviewData
} from '../types';

export const API_BASE = import.meta.env.DEV ? '/api' : 'http://85.198.80.80:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

const handleResponse = <T>(promise: Promise<{ data: T }>): Promise<T> => {
  return promise
    .then(res => res.data)
    .catch((error: AxiosError) => {
      if (error.response?.status === 418) {
        return [] as unknown as T;
      }
      throw error;
    });
};

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export const placesApi = {
  getAll: (pagination?: PaginationParams): Promise<Place[]> => {
    const params = new URLSearchParams();
    if (pagination?.limit !== undefined) params.append('limit', String(pagination.limit));
    if (pagination?.offset !== undefined) params.append('offset', String(pagination.offset));
    if (pagination?.page !== undefined) params.append('page', String(pagination.page));
    const queryString = params.toString();
    return handleResponse(api.get<Place[]>(`/place/${queryString ? `?${queryString}` : ''}`));
  },

  getById: (id: number): Promise<Place> => {
    return handleResponse(api.get<Place>(`/place/point/${id}`));
  },

  search: (filters: SearchFilters, pagination?: PaginationParams): Promise<Place[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    if (pagination?.limit !== undefined) params.append('limit', String(pagination.limit));
    if (pagination?.offset !== undefined) params.append('offset', String(pagination.offset));
    if (pagination?.page !== undefined) params.append('page', String(pagination.page));
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

  getAll: (pagination?: PaginationParams): Promise<User[]> => {
    const params = new URLSearchParams();
    if (pagination?.limit !== undefined) params.append('limit', String(pagination.limit));
    if (pagination?.offset !== undefined) params.append('offset', String(pagination.offset));
    if (pagination?.page !== undefined) params.append('page', String(pagination.page));
    const queryString = params.toString();
    return handleResponse(api.get<User[]>(`/user/${queryString ? `?${queryString}` : ''}`));
  },
};

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

export const photoApi = {
  upload: async (file: File): Promise<string> => {
    const contentType = file.type || 'image/jpeg';
    
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const response = await fetch(`${API_BASE}/photo/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(uint8Array.length),
      },
      body: uint8Array,
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('Photo upload failed:', response.status, errorText);
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url;
  },
};

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
  
  getUser: async (id: number) => {
    const response = await fetch(`/api/user/${id}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  followUser: async (userId: number, followId: number) => {
    const response = await fetch('/api/user/follow/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, follow_id: followId }),
    });
    if (!response.ok) throw new Error('Failed to follow user');
    return response.json();
  },

  getPlaces: async (params: { page?: number; limit?: number; [key: string]: any }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) searchParams.append(key, String(value));
    });
    const response = await fetch(`/api/place/search?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch places');
    return response.json();
  },

  sendChatMessage: async (text: string) => {
    const response = await fetch('/api/gpt/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
  },
};

export default api;
