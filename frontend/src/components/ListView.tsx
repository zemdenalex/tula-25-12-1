import { useState } from 'react';
import { Search, Star, MapPin } from 'lucide-react';
import { useStore } from '../store';
import type { Place } from '../types';

function PlaceListItem({ place }: { place: Place }) {
  const { setSelectedPlace } = useStore();
  
  const getTypeTag = () => {
    if (place.type?.includes('Спорт')) return { text: 'Спортзал', color: 'tag-green' };
    if (place.type?.includes('Медицин')) return { text: 'Медицина', color: 'tag-blue' };
    if (place.type?.includes('Магазин')) return { text: 'Магазин', color: 'tag-yellow' };
    if (place.type?.includes('Питани')) return { text: 'Питание', color: 'tag-yellow' };
    return { text: place.type || 'Место', color: 'tag-blue' };
  };
  
  const tag = getTypeTag();
  const reviewCount = place.reviews?.length || 0;
  const rating = place.rating ? (place.rating / 20).toFixed(1) : null;

  return (
    <div 
      className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => setSelectedPlace(place)}
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-3xl">
            {place.type?.includes('Спорт') ? '🏋️' : 
             place.type?.includes('Медицин') ? '🏥' :
             place.type?.includes('Магазин') ? '🛒' :
             place.type?.includes('Питани') ? '🍽️' : '📍'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <span className={`tag ${tag.color} mb-2`}>{tag.text}</span>
          
          <h3 className="font-semibold text-gray-900 truncate">
            {place.name || 'Без названия'}
          </h3>
          
          <p className="text-sm text-gray-500 truncate mt-1">
            {place.info || 'Нет описания'}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {rating && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">{rating}</span>
              </div>
            )}
            {reviewCount > 0 && (
              <span className="text-sm text-gray-500">
                ({reviewCount} {reviewCount === 1 ? 'отзыв' : 'отзывов'})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ListView() {
  const { places, isLoading, setFilterModalOpen } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredPlaces = places.filter(place => 
    place.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.info?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    place.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterModalOpen(true)}
            className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <span className="text-lg">⚙️</span>
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Ничего не найдено</p>
          </div>
        ) : (
          filteredPlaces.map((place) => (
            <PlaceListItem key={place.id} place={place} />
          ))
        )}
      </div>
    </div>
  );
}
