import { useEffect } from 'react';
import { useStore } from '../store';
import { 
  Header, 
  MapView, 
  ListView, 
  BottomSheet, 
  ReviewForm, 
  AuthModal, 
  FilterModal 
} from '../components';

export default function HomePage() {
  const { viewMode, fetchPlaces, fetchPlaceTypes, userId, fetchUserById, isLoading } = useStore();

  useEffect(() => {
    fetchPlaces();
    fetchPlaceTypes();
  }, [fetchPlaces, fetchPlaceTypes]);

  // Restore user session
  useEffect(() => {
    if (userId) {
      fetchUserById(userId);
    }
  }, [userId, fetchUserById]);

  return (
    <div className="h-screen flex flex-col">
      <Header />
      
      {/* Main content with header offset */}
      <main className="flex-1 pt-[60px] relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-600">Загрузка...</p>
            </div>
          </div>
        )}
        
        {viewMode === 'map' ? <MapView /> : <ListView />}
      </main>

      {/* Modals */}
      <BottomSheet />
      <ReviewForm />
      <AuthModal />
      <FilterModal />
    </div>
  );
}
