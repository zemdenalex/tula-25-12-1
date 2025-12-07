import React, { useEffect, useRef, useCallback } from 'react';
import { Place, useStore } from '../store';
import { StarIcon, MapPinIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';

interface ListViewProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  useFilters?: boolean;
}

const ListView: React.FC<ListViewProps> = ({ places, onPlaceSelect, useFilters = false }) => {
  const { 
    isLoadingMorePlaces, 
    hasMorePlaces, 
    fetchMorePlaces, 
    fetchMorePlacesWithFilters,
    filters 
  } = useStore();
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (!isLoadingMorePlaces && hasMorePlaces) {
      if (useFilters) {
        fetchMorePlacesWithFilters(filters);
      } else {
        fetchMorePlaces();
      }
    }
  }, [isLoadingMorePlaces, hasMorePlaces, useFilters, fetchMorePlaces, fetchMorePlacesWithFilters, filters]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePlaces && !isLoadingMorePlaces) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMorePlaces, isLoadingMorePlaces]);

  if (places.length === 0 && !isLoadingMorePlaces) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <MapPinIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Места не найдены</p>
          <p className="text-gray-400 text-sm mt-1">Попробуйте изменить фильтры</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pt-20 pb-4 px-4">
      <div className="max-w-2xl mx-auto space-y-3">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} onClick={() => onPlaceSelect(place)} />
        ))}
        
        {/* Infinite scroll trigger */}
        {hasMorePlaces && (
          <div ref={observerTarget} className="py-4 flex justify-center">
            {isLoadingMorePlaces && (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                <span>Загрузка...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onClick }) => {
  const rating = place.review_rank || place.rating || 0;
  const reviewCount = place.reviews?.length || 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all text-left"
    >
      <div className="flex gap-4">
        {/* Placeholder image */}
        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
          <MapPinIcon className="w-8 h-8 text-gray-300" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {place.name || 'Без названия'}
          </h3>
          
          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`w-4 h-4 ${
                    star <= rating ? 'text-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {rating > 0 ? rating.toFixed(1) : '—'} ({reviewCount} отзывов)
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {place.type && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                {place.type}
              </span>
            )}
            {place.is_health && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                Полезное место
              </span>
            )}
            {place.is_nosmoking && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                Без курения
              </span>
            )}
          </div>

          {/* Description preview */}
          {place.info && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-1">
              {place.info}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default ListView;