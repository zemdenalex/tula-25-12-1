import { create } from 'zustand';
import axios from 'axios';

// API Base URL - use environment variable or default to remote server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://85.198.80.80:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increase to 60 seconds for large datasets
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types based on OpenAPI spec
export interface Product {
  id?: number | null;
  type?: string | null;
  name: string;
  min_cost?: number | null;
  is_health?: boolean | null;
  is_alcohol?: boolean | null;
  is_smoking?: boolean | null;
}

export interface Equipment {
  name?: string | null;
  count?: number | null;
  type?: number | null;
}

export interface Ads {
  id?: number | null;
  type?: string | null;
  name: string;
  is_health?: boolean | null;
}

export interface Review {
  id?: number | null;
  id_user?: number | null;
  user_name?: string | null;
  id_place?: number | null;
  text?: string | null;
  review_photos: string[];
  like?: number | null;
  dislike?: number | null;
}

export interface Place {
  id?: number | null;
  name?: string | null;
  info?: string | null;
  coord1: number;
  coord2: number;
  type?: string | null;
  food_type?: string | null;
  is_alcohol?: boolean | null;
  is_health?: boolean | null;
  is_insurance?: boolean | null;
  is_nosmoking?: boolean | null;
  is_smoke?: boolean | null;
  rating?: number | null;
  sport_type?: string | null;
  distance_to_center?: number | null;
  is_moderated?: boolean | null;
  review_rank?: number | null;
  products: Product[];
  equipment: Equipment[];
  ads: Ads[];
  reviews: Review[];
}

export interface User {
  user_id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  photo?: string | null;
  rating?: number | null;
}

export interface PlaceFilters {
  place_type?: number | null;
  is_alcohol?: boolean | null;
  is_health?: boolean | null;
  is_nosmoking?: boolean | null;
  is_smoke?: boolean | null;
  max_distance?: number | null;
  is_moderated?: boolean | null;
  has_product_type?: number[] | null;
  has_equipment_type?: number[] | null;
  has_ads_type?: number[] | null;
  minRating?: number | null;
}

export type ViewMode = 'map' | 'list';

interface AppState {
  // Places
  places: Place[];
  selectedPlace: Place | null;
  isLoadingPlaces: boolean;
  isLoadingMorePlaces: boolean;
  placesError: string | null;
  hasMorePlaces: boolean;
  currentPage: number;
  paginationLimit: number;
  
  // User
  user: User | null;
  isAuthenticated: boolean;
  authError: string | null;
  
  // Users list (for leaderboard)
  users: User[];
  isLoadingUsers: boolean;
  
  // UI state
  viewMode: ViewMode;
  filterModalOpen: boolean;
  searchQuery: string;
  filters: PlaceFilters;
  
  // Actions - Places
  fetchPlaces: (reset?: boolean) => Promise<void>;
  fetchMorePlaces: () => Promise<void>;
  fetchPlacesWithFilters: (filters: PlaceFilters, reset?: boolean) => Promise<void>;
  fetchMorePlacesWithFilters: (filters: PlaceFilters) => Promise<void>;
  fetchPlaceById: (id: number) => Promise<Place | null>;
  setSelectedPlace: (place: Place | null) => void;
  addPlace: (data: {
    name: string;
    info?: string;
    coord1: number;
    coord2: number;
    type?: number;
    is_alcohol?: boolean;
    is_health?: boolean;
    is_nosmoking?: boolean;
    is_smoke?: boolean;
  }) => Promise<number | null>;
  updatePlace: (id: number, data: any) => Promise<boolean>;
  
  // Actions - Auth
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Actions - Users
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: number) => Promise<User | null>;
  
  // Actions - Reviews
  addReview: (data: {
    message: string;
    user_id: number;
    place_id: number;
    rating: number;
    photos?: string[];
  }) => Promise<boolean>;
  setReviewRank: (userId: number, reviewId: number, like?: boolean, dislike?: boolean) => Promise<boolean>;
  
  // Actions - UI
  setViewMode: (mode: ViewMode) => void;
  setFilterModalOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: PlaceFilters) => void;
  clearFilters: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  places: [],
  selectedPlace: null,
  isLoadingPlaces: false,
  isLoadingMorePlaces: false,
  placesError: null,
  hasMorePlaces: true,
  currentPage: 1,
  paginationLimit: 10,
  
  user: null,
  isAuthenticated: false,
  authError: null,
  
  users: [],
  isLoadingUsers: false,
  
  // UI state
  viewMode: 'map',
  filterModalOpen: false,
  searchQuery: '',
  filters: {
    max_distance: 5,
    is_moderated: true,
  },
  
    // Place actions
  fetchPlaces: async (reset = true) => {
    // Don't fetch if already loading
    if (get().isLoadingPlaces) {
      console.log('Already loading places, skipping...');
      return;
    }
    
    const limit = get().paginationLimit;
    const page = reset ? 1 : get().currentPage;
    const offset = limit;
    
    set({ isLoadingPlaces: true, placesError: null, currentPage: page });
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      params.append('page', String(reset ? 1 : page));
      const response = await api.get<Place[]>(`/place/?${params.toString()}`);
      const newPlaces = response.data || [];
      console.log('Fetched places:', newPlaces.length);
      
      set({ 
        places: reset ? newPlaces : [...get().places, ...newPlaces],
        isLoadingPlaces: false,
        hasMorePlaces: newPlaces.length === limit,
        currentPage: page
      });
    } catch (error: any) {
      console.error('Failed to fetch places:', error);
      const currentPlaces = get().places;
      set({ 
        placesError: error.message || 'Failed to fetch places', 
        isLoadingPlaces: false,
        places: reset ? [] : currentPlaces
      });
    }
  },
  
  fetchMorePlaces: async () => {
    const state = get();
    if (state.isLoadingMorePlaces || !state.hasMorePlaces || state.isLoadingPlaces) {
      return;
    }
    
    set({ isLoadingMorePlaces: true });
    const nextPage = state.currentPage + 1;
    const limit = state.paginationLimit;
    const offset = limit;
    
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      params.append('page', String(nextPage));
      const response = await api.get<Place[]>(`/place/?${params.toString()}`);
      const newPlaces = response.data || [];
      
      set({ 
        places: [...state.places, ...newPlaces],
        isLoadingMorePlaces: false,
        hasMorePlaces: newPlaces.length === limit,
        currentPage: nextPage
      });
    } catch (error: any) {
      console.error('Failed to fetch more places:', error);
      set({ isLoadingMorePlaces: false });
    }
  },
  
  fetchPlacesWithFilters: async (filters: PlaceFilters, reset = true) => {
    const limit = get().paginationLimit;
    const page = reset ? 1 : get().currentPage;
    const offset = limit;
    
    set({ isLoadingPlaces: true, placesError: null, currentPage: page });
    try {
      const params = new URLSearchParams();
      
      if (filters.place_type != null) params.append('place_type', String(filters.place_type));
      if (filters.is_alcohol != null) params.append('is_alcohol', String(filters.is_alcohol));
      if (filters.is_health != null) params.append('is_health', String(filters.is_health));
      if (filters.is_nosmoking != null) params.append('is_nosmoking', String(filters.is_nosmoking));
      if (filters.is_smoke != null) params.append('is_smoke', String(filters.is_smoke));
      if (filters.max_distance != null) params.append('max_distance', String(filters.max_distance));
      if (filters.is_moderated != null) params.append('is_moderated', String(filters.is_moderated));
      
      if (filters.has_product_type) {
        filters.has_product_type.forEach(id => params.append('has_product_type', String(id)));
      }
      if (filters.has_equipment_type) {
        filters.has_equipment_type.forEach(id => params.append('has_equipment_type', String(id)));
      }
      if (filters.has_ads_type) {
        filters.has_ads_type.forEach(id => params.append('has_ads_type', String(id)));
      }
      
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      params.append('page', String(reset ? 1 : page));
      
      const response = await api.get<Place[]>(`/place/search?${params.toString()}`);
      const newPlaces = response.data || [];
      
      set({ 
        places: reset ? newPlaces : [...get().places, ...newPlaces],
        isLoadingPlaces: false,
        hasMorePlaces: newPlaces.length === limit,
        currentPage: page
      });
    } catch (error: any) {
      console.error('Failed to fetch places with filters:', error);
      set({ 
        placesError: error.message || 'Failed to fetch places', 
        isLoadingPlaces: false,
        places: reset ? [] : get().places
      });
    }
  },
  
  fetchMorePlacesWithFilters: async (filters: PlaceFilters) => {
    const state = get();
    if (state.isLoadingMorePlaces || !state.hasMorePlaces || state.isLoadingPlaces) {
      return;
    }
    
    set({ isLoadingMorePlaces: true });
    const nextPage = state.currentPage + 1;
    const limit = state.paginationLimit;
    const offset = limit;
    
    try {
      const params = new URLSearchParams();
      
      if (filters.place_type != null) params.append('place_type', String(filters.place_type));
      if (filters.is_alcohol != null) params.append('is_alcohol', String(filters.is_alcohol));
      if (filters.is_health != null) params.append('is_health', String(filters.is_health));
      if (filters.is_nosmoking != null) params.append('is_nosmoking', String(filters.is_nosmoking));
      if (filters.is_smoke != null) params.append('is_smoke', String(filters.is_smoke));
      if (filters.max_distance != null) params.append('max_distance', String(filters.max_distance));
      if (filters.is_moderated != null) params.append('is_moderated', String(filters.is_moderated));
      
      if (filters.has_product_type) {
        filters.has_product_type.forEach(id => params.append('has_product_type', String(id)));
      }
      if (filters.has_equipment_type) {
        filters.has_equipment_type.forEach(id => params.append('has_equipment_type', String(id)));
      }
      if (filters.has_ads_type) {
        filters.has_ads_type.forEach(id => params.append('has_ads_type', String(id)));
      }
      
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      params.append('page', String(nextPage));
      
      const response = await api.get<Place[]>(`/place/search?${params.toString()}`);
      const newPlaces = response.data || [];
      
      set({ 
        places: [...state.places, ...newPlaces],
        isLoadingMorePlaces: false,
        hasMorePlaces: newPlaces.length === limit,
        currentPage: nextPage
      });
    } catch (error: any) {
      console.error('Failed to fetch more places with filters:', error);
      set({ isLoadingMorePlaces: false });
    }
  },
  
  fetchPlaceById: async (id: number) => {
    try {
      const response = await api.get<Place>(`/place/point/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch place:', error);
      return null;
    }
  },
  
  setSelectedPlace: (place: Place | null) => {
    set({ selectedPlace: place });
  },

  addPlace: async (data) => {
    try {
      const response = await api.post<number>('/place/', data);
      await get().fetchPlaces();
      return response.data;
    } catch (error) {
      console.error('Failed to add place:', error);
      return null;
    }
  },
  
  updatePlace: async (id: number, data: any) => {
    try {
      await api.post(`/place/change/${id}`, data);
      await get().fetchPlaces();
      return true;
    } catch (error) {
      console.error('Failed to update place:', error);
      return false;
    }
  },
  
  // Auth actions
  login: async (email: string, password: string) => {
    set({ authError: null });
    try {
      const response = await api.post<{ user_id: number; name?: string; email?: string; rating?: number }>('/user/login', {
        email,
        password,
      });
      
      console.log('Login response:', response.data);
      
      const userData: User = {
        user_id: response.data.user_id,
        name: response.data.name,
        email: response.data.email,
        rating: response.data.rating,
      };
      
      set({ user: userData, isAuthenticated: true });
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.detail || 'Неверный email или пароль';
      set({ authError: errorMsg });
      return false;
    }
  },
  
  register: async (name: string, email: string, password: string) => {
    set({ authError: null });
    try {
      const response = await api.post<{ user_id: number }>('/user/create', {
        name,
        email,
        password,
      });
      
      console.log('Register response:', response.data);
      
      const userData: User = {
        user_id: response.data.user_id,
        name,
        email,
      };
      
      set({ user: userData, isAuthenticated: true });
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMsg = error.response?.data?.detail || 'Ошибка регистрации';
      set({ authError: errorMsg });
      return false;
    }
  },
  
  logout: () => {
    set({ user: null, isAuthenticated: false });
    localStorage.removeItem('user');
  },
  
  // User actions
  fetchUsers: async () => {
    set({ isLoadingUsers: true });
    try {
      const response = await api.get<User[]>('/user/');
      console.log('Fetched users:', response.data);
      set({ users: response.data || [], isLoadingUsers: false });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      set({ isLoadingUsers: false, users: [] });
    }
  },
  
  fetchUserById: async (id: number) => {
    try {
      const response = await api.get<User>(`/user/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      return null;
    }
  },
  
  // Review actions
  addReview: async (data) => {
    try {
      await api.post('/user/review', data);
      await get().fetchPlaces();
      return true;
    } catch (error) {
      console.error('Failed to add review:', error);
      return false;
    }
  },
  
  setReviewRank: async (userId: number, reviewId: number, like?: boolean, dislike?: boolean) => {
    try {
      await api.post('/review/rank', {
        user_id: userId,
        review_id: reviewId,
        like: like ?? null,
        dislike: dislike ?? null,
      });
      return true;
    } catch (error) {
      console.error('Failed to set review rank:', error);
      return false;
    }
  },
  
  // UI actions
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },
  
  setFilterModalOpen: (open: boolean) => {
    set({ filterModalOpen: open });
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  setFilters: (filters: PlaceFilters) => {
    set({ filters: { ...get().filters, ...filters } });
  },
  
  clearFilters: () => {
    set({ 
      filters: {
        max_distance: 5,
        is_moderated: true,
      }
    });
  },
}));

// Photo upload function (separate from store due to FormData)
export const uploadPhoto = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/photo/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Photo upload failed:', response.status, errorData);
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.url || data;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    return null;
  }
};

// Initialize user from localStorage
const savedUser = localStorage.getItem('user');
if (savedUser) {
  try {
    const userData = JSON.parse(savedUser);
    useStore.setState({ user: userData, isAuthenticated: true });
  } catch (e) {
    localStorage.removeItem('user');
  }
}