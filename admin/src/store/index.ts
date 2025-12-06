import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { adminApi, dataApi, Place, User } from '../api';

interface AdminState {
  adminId: number | null;
  isLoggedIn: boolean;
  places: Place[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  activeTab: 'places' | 'users' | 'admins';
  
  login: (email: string, pwd: string) => Promise<boolean>;
  logout: () => void;
  fetchPlaces: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  verifyPlace: (id: number, verify: boolean) => Promise<void>;
  updateUserRating: (id: number, rating: number) => Promise<void>;
  banUser: (id: number) => Promise<void>;
  deleteReview: (id: number, rating?: number) => Promise<void>;
  createAdmin: (name: string, email: string, password: string) => Promise<void>;
  setActiveTab: (tab: 'places' | 'users' | 'admins') => void;
  setError: (error: string | null) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      adminId: null,
      isLoggedIn: false,
      places: [],
      users: [],
      isLoading: false,
      error: null,
      activeTab: 'places',

      login: async (email, pwd) => {
        set({ isLoading: true, error: null });
        try {
          const result = await adminApi.login(email, pwd);
          set({ adminId: result.id, isLoggedIn: true, isLoading: false });
          return true;
        } catch (e: any) {
          set({ error: 'Неверный email или пароль', isLoading: false });
          return false;
        }
      },

      logout: () => {
        set({ adminId: null, isLoggedIn: false, places: [], users: [] });
      },

      fetchPlaces: async () => {
        set({ isLoading: true });
        try {
          const places = await dataApi.getPlaces();
          set({ places, isLoading: false });
        } catch (e) {
          set({ error: 'Ошибка загрузки мест', isLoading: false });
        }
      },

      fetchUsers: async () => {
        set({ isLoading: true });
        try {
          const users = await dataApi.getUsers();
          set({ users, isLoading: false });
        } catch (e) {
          set({ error: 'Ошибка загрузки пользователей', isLoading: false });
        }
      },

      verifyPlace: async (id, verify) => {
        try {
          await adminApi.verifyPlace(id, verify);
          await get().fetchPlaces();
        } catch (e) {
          set({ error: 'Ошибка верификации' });
        }
      },

      updateUserRating: async (id, rating) => {
        try {
          await adminApi.updateUserRating(id, rating);
          await get().fetchUsers();
        } catch (e) {
          set({ error: 'Ошибка обновления рейтинга' });
        }
      },

      banUser: async (id) => {
        try {
          await adminApi.banUser(id);
          await get().fetchUsers();
        } catch (e) {
          set({ error: 'Ошибка бана пользователя' });
        }
      },

      deleteReview: async (id, rating) => {
        try {
          await adminApi.deleteReview(id, rating);
          await get().fetchPlaces();
        } catch (e) {
          set({ error: 'Ошибка удаления отзыва' });
        }
      },

      createAdmin: async (name, email, password) => {
        const { adminId } = get();
        if (!adminId) return;
        try {
          await adminApi.create(adminId, name, email, password);
          set({ error: null });
        } catch (e) {
          set({ error: 'Ошибка создания админа' });
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ adminId: state.adminId, isLoggedIn: state.isLoggedIn }),
    }
  )
);
