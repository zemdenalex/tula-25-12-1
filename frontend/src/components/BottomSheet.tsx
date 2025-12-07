import React, { useState } from 'react';
import { Place, useStore } from '../store';
import { 
  XMarkIcon, 
  StarIcon,
  MapPinIcon,
  HeartIcon,
  ShareIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import ReviewForm from './ReviewForm';
import ReviewCard from './ReviewCard';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place | null;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, place }) => {
  const { isAuthenticated } = useStore();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  if (!place) return null;

  const rating = place.review_rank || place.rating || 0;
  const reviewCount = place.reviews?.length || 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transition-transform duration-300 max-h-[85vh] overflow-hidden flex flex-col ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">
                {place.name || 'Без названия'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {place.info?.substring(0, 50) || 'Нет описания'}
              </p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIconSolid
                      key={star}
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {rating > 0 ? rating.toFixed(1) : '—'} ({reviewCount} отзывов)
                </span>
              </div>
            </div>

            {/* Placeholder image */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg ml-4 flex items-center justify-center flex-shrink-0">
              <MapPinIcon className="w-8 h-8 text-gray-300" />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-3">
            {place.type && (
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                {place.type}
              </span>
            )}
            {place.is_health && (
              <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                Полезное место
              </span>
            )}
            {place.is_nosmoking && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                Без курения
              </span>
            )}
            {place.is_alcohol && (
              <span className="px-3 py-1 bg-red-50 text-red-600 text-sm rounded-full">
                Алкоголь
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Description */}
          {place.info && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
              <p className="text-gray-600">{place.info}</p>
            </div>
          )}

          {/* Reviews section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Отзывы ({reviewCount})
              </h3>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </div>

            {/* Review form toggle */}
            {isAuthenticated && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full py-3 mb-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Написать отзыв
              </button>
            )}

            {/* Review form */}
            {showReviewForm && place.id && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                <ReviewForm
                  placeId={place.id}
                  onSuccess={() => setShowReviewForm(false)}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

            {/* Reviews list */}
            {place.reviews && place.reviews.length > 0 ? (
              <div className="space-y-4">
                {place.reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Пока нет отзывов. Будьте первым!
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-3 rounded-xl border transition-colors ${
              isLiked 
                ? 'bg-red-50 border-red-200 text-red-500' 
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {isLiked ? (
              <HeartIconSolid className="w-6 h-6" />
            ) : (
              <HeartIcon className="w-6 h-6" />
            )}
          </button>
          <button className="p-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ShareIcon className="w-6 h-6" />
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  );
};

export default BottomSheet;