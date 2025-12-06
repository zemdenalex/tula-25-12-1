import { X, Star, MapPin, ThumbsUp, ThumbsDown, Heart, Cigarette, Wine, Shield } from 'lucide-react';
import { useStore } from '../store';
import { reviewsApi } from '../api';
import type { ReviewData } from '../types';

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

function HealthScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all`} 
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-semibold text-gray-700 min-w-[3rem] text-right">{score}%</span>
    </div>
  );
}

function ReviewCard({ review, userId }: { review: ReviewData; userId: number | null }) {
  const { refreshSelectedPlace } = useStore();

  const handleLike = async () => {
    if (!userId) return;
    try {
      await reviewsApi.setRank({ user_id: userId, review_id: review.id!, like: true });
      refreshSelectedPlace();
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleDislike = async () => {
    if (!userId) return;
    try {
      await reviewsApi.setRank({ user_id: userId, review_id: review.id!, dislike: true });
      refreshSelectedPlace();
    } catch (error) {
      console.error('Failed to dislike:', error);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
          {review.user_name?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{review.user_name || 'Пользователь'}</span>
          </div>
          <p className="text-gray-700 mt-1">{review.text}</p>
          
          {/* Review photos */}
          {review.review_photos && review.review_photos.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {review.review_photos.map((photo, idx) => (
                <img 
                  key={idx} 
                  src={photo} 
                  alt="Фото отзыва"
                  className="w-20 h-20 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          {/* Like/Dislike */}
          <div className="flex items-center gap-4 mt-3">
            <button 
              onClick={handleLike}
              disabled={!userId}
              className="flex items-center gap-1 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50"
            >
              <ThumbsUp size={16} />
              <span className="text-sm">{review.like || 0}</span>
            </button>
            <button 
              onClick={handleDislike}
              disabled={!userId}
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              <ThumbsDown size={16} />
              <span className="text-sm">{review.dislike || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BottomSheet() {
  const { 
    selectedPlace, 
    isBottomSheetOpen, 
    setBottomSheetOpen, 
    setSelectedPlace,
    setReviewFormOpen,
    setAuthModalOpen,
    user,
    userId
  } = useStore();

  if (!isBottomSheetOpen || !selectedPlace) return null;

  const handleClose = () => {
    setBottomSheetOpen(false);
    setSelectedPlace(null);
  };

  const handleWriteReview = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setReviewFormOpen(true);
  };

  const healthScore = selectedPlace.rating || 0;
  const userRating = selectedPlace.review_rank || 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85vh] flex flex-col safe-area-bottom">
        {/* Handle */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {selectedPlace.name || 'Без названия'}
              </h2>
              <p className="text-gray-500 mt-1">{selectedPlace.type}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Dual Ratings */}
          <div className="mt-4 space-y-3">
            {/* User Rating */}
            {userRating > 0 && (
              <div className="flex items-center gap-3">
                <StarRating rating={Math.round(userRating)} />
                <span className="text-gray-600">{userRating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">
                  ({selectedPlace.reviews?.length || 0} отзывов)
                </span>
              </div>
            )}

            {/* Health Score */}
            {healthScore > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Индекс здоровья</span>
                </div>
                <HealthScore score={healthScore} />
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedPlace.is_health && (
              <span className="tag tag-green">
                <Heart size={14} className="mr-1" /> Здоровое
              </span>
            )}
            {selectedPlace.is_nosmoking && (
              <span className="tag tag-blue">
                <Cigarette size={14} className="mr-1" /> Без курения
              </span>
            )}
            {selectedPlace.is_smoke && (
              <span className="tag tag-red">
                <Cigarette size={14} className="mr-1" /> Курение
              </span>
            )}
            {selectedPlace.is_alcohol && (
              <span className="tag tag-yellow">
                <Wine size={14} className="mr-1" /> Алкоголь
              </span>
            )}
            {selectedPlace.is_insurance && (
              <span className="tag tag-blue">
                <Shield size={14} className="mr-1" /> Страхование
              </span>
            )}
            {selectedPlace.is_moderated && (
              <span className="tag tag-green">✓ Проверено</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Info */}
          {selectedPlace.info && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Описание</h3>
              <p className="text-gray-600">{selectedPlace.info}</p>
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-500 mb-6">
            <MapPin size={16} />
            <span>
              {selectedPlace.coord1?.toFixed(5)}, {selectedPlace.coord2?.toFixed(5)}
            </span>
            {selectedPlace.distance_to_center && (
              <span className="ml-2">• {selectedPlace.distance_to_center.toFixed(1)} км от центра</span>
            )}
          </div>

          {/* Reviews */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">
                Отзывы ({selectedPlace.reviews?.length || 0})
              </h3>
              <button
                onClick={handleWriteReview}
                className="text-primary-600 font-medium text-sm hover:text-primary-700"
              >
                Написать отзыв
              </button>
            </div>

            {selectedPlace.reviews && selectedPlace.reviews.length > 0 ? (
              <div className="space-y-3">
                {selectedPlace.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} userId={userId} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Пока нет отзывов. Будьте первым!
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={handleWriteReview}
            className="btn-primary w-full"
          >
            Написать отзыв
          </button>
        </div>
      </div>
    </>
  );
}
