import { Star, MapPin } from 'lucide-react';
import type { Place } from '../types';

interface PlaceCardProps {
  place: Place;
  onClick: () => void;
}

export default function PlaceCard({ place, onClick }: PlaceCardProps) {
  const getEmoji = () => {
    const placeType = place.type?.toLowerCase() || '';
    if (placeType.includes('медицин') || placeType.includes('аптек')) return '🏥';
    if (placeType.includes('спорт') || placeType.includes('фитнес')) return '🏋️';
    if (placeType.includes('магазин') || placeType.includes('торгов')) return '🛒';
    if (placeType.includes('еда') || placeType.includes('кафе')) return '🍽️';
    if (placeType.includes('транспорт')) return '🚌';
    if (placeType.includes('промышлен')) return '🏭';
    if (place.is_health) return '💚';
    return '📍';
  };

  const userRating = place.review_rank || 0;
  const healthScore = place.rating || 0;

  return (
    <button
      onClick={onClick}
      className="w-full card p-4 text-left hover:shadow-md transition-shadow"
    >
      <div className="flex gap-4">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          {getEmoji()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">
                {place.name || 'Без названия'}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {place.type || 'Тип не указан'}
              </p>
            </div>
            {healthScore > 0 && (
              <div className={`tag text-xs ${healthScore >= 70 ? 'tag-green' : healthScore >= 40 ? 'tag-yellow' : 'tag-red'}`}>
                {healthScore}%
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2">
            {userRating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="text-sm text-gray-600">{userRating.toFixed(1)}</span>
              </div>
            )}
            {place.reviews?.length > 0 && (
              <span className="text-sm text-gray-400">
                {place.reviews.length} отзыв{place.reviews.length > 1 ? (place.reviews.length < 5 ? 'а' : 'ов') : ''}
              </span>
            )}
            {place.distance_to_center && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <MapPin size={12} />
                {place.distance_to_center.toFixed(1)} км
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
