import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Place, User, PlaceTypes, SearchFilters, ViewMode } from '../types';
import { placesApi, usersApi } from '../api';

interface AppState {
  // Data
  places: Place[];
  selectedPlace: Place | null;
  placeTypes: PlaceTypes | null;
  user: User | null;
  userId: number | null;
  
  // UI state
  viewMode: ViewMode;
  filters: SearchFilters;
  isLoading: boolean;
  isBottomSheetOpen: boolean;
  isReviewFormOpen: boolean;
  isAuthModalOpen: boolean;
  isFilterModalOpen: boolean;
  isAddPlaceModalOpen: boolean;

  // Actions
  setPlaces: (places: Place[]) => void;
  setSelectedPlace: (place: Place | null) => void;
  setPlaceTypes: (types: PlaceTypes) => void;
  setUser: (user: User | null) => void;
  setUserId: (id: number | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: SearchFilters) => void;
  setIsLoading: (loading: boolean) => void;
  setBottomSheetOpen: (open: boolean) => void;
  setReviewFormOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
  setFilterModalOpen: (open: boolean) => void;
  setAddPlaceModalOpen: (open: boolean) => void;

  // Async actions
  fetchPlaces: () => Promise<void>;
  fetchPlaceTypes: () => Promise<void>;
  fetchUserById: (id: number) => Promise<void>;
  searchPlaces: (filters: SearchFilters) => Promise<void>;
  refreshSelectedPlace: () => Promise<void>;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      places: [],
      selectedPlace: null,
      placeTypes: null,
      user: null,
      userId: null,
      viewMode: 'map',
      filters: { is_moderated: false, max_distance: 100 },
      isLoading: false,
      isBottomSheetOpen: false,
      isReviewFormOpen: false,
      isAuthModalOpen: false,
      isFilterModalOpen: false,
      isAddPlaceModalOpen: false,

      // Setters
      setPlaces: (places) => set({ places }),
      setSelectedPlace: (place) => set({ selectedPlace: place, isBottomSheetOpen: !!place }),
      setPlaceTypes: (types) => set({ placeTypes: types }),
      setUser: (user) => set({ user }),
      setUserId: (id) => set({ userId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFilters: (filters) => set({ filters }),
      setIsLoading: (loading) => set({ isLoading: loading }),
      setBottomSheetOpen: (open) => set({ isBottomSheetOpen: open }),
      setReviewFormOpen: (open) => set({ isReviewFormOpen: open }),
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      setFilterModalOpen: (open) => set({ isFilterModalOpen: open }),
      setAddPlaceModalOpen: (open) => set({ isAddPlaceModalOpen: open }),

      // Async actions
      fetchPlaces: async () => {
        set({ isLoading: true });
        try {
          const places = await placesApi.getAll();
          set({ places: Array.isArray(places) ? places : [] });
        } catch (error) {
          console.error('Failed to fetch places:', error);
          set({ places: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchPlaceTypes: async () => {
        try {
          const types = await placesApi.getTypes();
          if (types && typeof types === 'object') {
            set({ placeTypes: types });
          }
        } catch (error) {
          console.error('Failed to fetch place types:', error);
        }
      },

      fetchUserById: async (id: number) => {
        try {
          const user = await usersApi.getById(id);
          set({ user, userId: id });
        } catch (error) {
          console.error('Failed to fetch user:', error);
          set({ user: null, userId: null });
        }
      },

      searchPlaces: async (filters: SearchFilters) => {
        set({ isLoading: true, filters });
        try {
          const places = await placesApi.search(filters);
          set({ places: Array.isArray(places) ? places : [] });
        } catch (error) {
          console.error('Failed to search places:', error);
          set({ places: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      refreshSelectedPlace: async () => {
        const { selectedPlace } = get();
        if (selectedPlace?.id) {
          try {
            const place = await placesApi.getById(selectedPlace.id);
            set({ selectedPlace: place });
          } catch (error) {
            console.error('Failed to refresh place:', error);
          }
        }
      },

      logout: () => set({ user: null, userId: null }),
    }),
    {
      name: 'health-map-storage',
      partialize: (state) => ({ userId: state.userId }),
    }
  )
);
