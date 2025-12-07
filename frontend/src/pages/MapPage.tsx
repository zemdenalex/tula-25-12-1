import React, { useState, useMemo } from 'react';
import { useStore, Place } from '../store';
import MapView from '../components/MapView';
import ListView from '../components/ListView';
import BottomSheet from '../components/BottomSheet';
import FilterModal from '../components/FilterModal';
import { 
  MapIcon, 
  ListBulletIcon, 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface MapPageProps {
  onAddPlace?: () => void;
}

const MapPage: React.FC<MapPageProps> = ({ onAddPlace }) => {
  const { 
    places, 
    selectedPlace, 
    setSelectedPlace, 
    isLoadingPlaces,
    viewMode,
    setViewMode,
    filterModalOpen,
    setFilterModalOpen,
    searchQuery,
    setSearchQuery,
    filters
  } = useStore();

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // Filter places based on search query
  const filteredPlaces = useMemo(() => {
    if (!searchQuery.trim()) return places;
    
    const query = searchQuery.toLowerCase();
    return places.filter(place => 
      place.name?.toLowerCase().includes(query) ||
      place.info?.toLowerCase().includes(query) ||
      place.type?.toLowerCase().includes(query)
    );
  }, [places, searchQuery]);

  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setBottomSheetOpen(true);
  };

  const handleCloseBottomSheet = () => {
    setBottomSheetOpen(false);
    setTimeout(() => setSelectedPlace(null), 300);
  };

  const toggleView = () => {
    setViewMode(viewMode === 'map' ? 'list' : 'map');
  };

  return (
    <div className="h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex flex-col relative">
      {/* Search and controls bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-2">
        {/* View toggle buttons */}
        <div className="flex bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setViewMode('map')}
            className={`p-3 transition-colors ${
              viewMode === 'map' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            title="Карта"
          >
            <MapIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-3 transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            title="Список"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск мест..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-lg shadow-md border-0 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Filter button */}
        <button
          onClick={() => setFilterModalOpen(true)}
          className="p-3 bg-white rounded-lg shadow-md text-gray-600 hover:bg-gray-100 transition-colors relative"
          title="Фильтры"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5" />
          {/* Filter indicator */}
          {(filters.is_health || filters.is_nosmoking || filters.is_alcohol || filters.is_smoke) && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Add place button (mobile) */}
        {onAddPlace && (
          <button
            onClick={onAddPlace}
            className="p-3 bg-blue-600 rounded-lg shadow-md text-white hover:bg-blue-700 transition-colors md:hidden"
            title="Добавить место"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1">
        {isLoadingPlaces ? (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Загрузка мест...</p>
            </div>
          </div>
        ) : viewMode === 'map' ? (
          <MapView 
            places={filteredPlaces} 
            onPlaceSelect={handlePlaceSelect}
            selectedPlace={selectedPlace}
          />
        ) : (
          <ListView 
            places={filteredPlaces} 
            onPlaceSelect={handlePlaceSelect}
          />
        )}
      </div>

      {/* Bottom sheet for place details */}
      <BottomSheet
        isOpen={bottomSheetOpen}
        onClose={handleCloseBottomSheet}
        place={selectedPlace}
      />

      {/* Filter modal */}
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
      />
    </div>
  );
};

export default MapPage;