import { X, Star, MapPin, ChevronLeft } from 'lucide-react';
import { useStore } from '../store';

export default function BottomSheet() {
  const { 
    selectedPlace, 
    isBottomSheetOpen, 
    setSelectedPlace, 
    setBottomSheetOpen,
    setReviewFormOpen,
    user,
    setAuthModalOpen
  } = useStore();

  if (!isBottomSheetOpen || !selectedPlace) return null;

  const rating = selectedPlace.rating ? (selectedPlace.rating / 20).toFixed(1) : null;
  const reviewCount = selectedPlace.reviews?.length || 0;

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

  const getTags = () => {
    const tags = [];
    if (selectedPlace.type) {
      tags.push({ text: selectedPlace.type, color: 'tag-blue' });
    }
    if (selectedPlace.is_health) {
      tags.push({ text: 'Полезное место', color: 'tag-green' });
    }
    if (selectedPlace.is_nosmoking) {
      tags.push({ text: 'Без курения', color: 'tag-green' });
    }
    if (selectedPlace.is_alcohol) {
      tags.push({ text: 'Алкоголь', color: 'tag-red' });
    }
    if (selectedPlace.is_smoke) {
      tags.push({ text: 'Курение', color: 'tag-red' });
    }
    return tags;
  };

  const tags = getTags();

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={handleClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col shadow-up">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft size={24} />
            </button>
            <h2 className="font-semibold text-lg">Информация</h2>
            <div className="w-8" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={20}
                  className={
                    rating && star <= Math.round(parseFloat(rating))
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }
                />
              ))}
            </div>
            {rating && (
              <span className="text-sm text-gray-600">
                {rating} ({reviewCount} {reviewCount === 1 ? 'отзыв' : 'отзывов'})
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {selectedPlace.name || 'Без названия'}
          </h1>
          
          <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
            <MapPin size={14} />
            {selectedPlace.info || 'Адрес не указан'}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag, i) => (
                <span key={i} className={`tag ${tag.color}`}>
                  {tag.text}
                </span>
              ))}
            </div>
          )}

          {selectedPlace.info && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
              <p className="text-gray-600 text-sm">{selectedPlace.info}</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Отзывы</h3>
            
            {selectedPlace.reviews && selectedPlace.reviews.length > 0 ? (
              <div className="space-y-3">
                {selectedPlace.reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 text-sm font-medium">
                          {review.user_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {review.user_name || 'Аноним'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Пока нет отзывов. Будьте первым!</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 safe-area-bottom">
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
