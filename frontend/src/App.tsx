import { useEffect } from 'react';
import { useStore } from './store';
import Header from './components/Header';
import MapView from './components/MapView';
import ListView from './components/ListView';
import BottomSheet from './components/BottomSheet';
import ReviewForm from './components/ReviewForm';
import AuthModal from './components/AuthModal';
import FilterModal from './components/FilterModal';

function App() {
  const { viewMode, fetchPlaces, fetchPlaceTypes, userId, fetchUserById } = useStore();

  useEffect(() => {
    fetchPlaces();
    fetchPlaceTypes();
  }, [fetchPlaces, fetchPlaceTypes]);

  useEffect(() => {
    if (userId) {
      fetchUserById(userId);
    }
  }, [userId, fetchUserById]);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 relative overflow-hidden">
        {viewMode === 'map' ? <MapView /> : <ListView />}
      </main>

      <BottomSheet />
      <ReviewForm />
      <AuthModal />
      <FilterModal />
    </div>
  );
}

export default App;
