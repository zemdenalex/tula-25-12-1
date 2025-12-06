import { useState } from 'react';
import { X, Star, Camera } from 'lucide-react';
import { useStore } from '../store';
import { reviewsApi, placesApi } from '../api';

export default function ReviewForm() {
  const { 
    isReviewFormOpen, 
    setReviewFormOpen, 
    selectedPlace, 
    user,
    fetchPlaces
  } = useStore();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isReviewFormOpen || !selectedPlace || !user) return null;

  const handleClose = () => {
    setReviewFormOpen(false);
    setRating(0);
    setText('');
    setError('');
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Пожалуйста, поставьте оценку');
      return;
    }

    if (!text.trim()) {
      setError('Пожалуйста, напишите комментарий');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await reviewsApi.add({
        message: text.trim(),
        user_id: user.user_id,
        place_id: selectedPlace.id!,
      });
      
      await fetchPlaces();
      handleClose();
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      if (err.response?.data?.detail === 'isNoGoodMessage') {
        setError('Сообщение не может быть пустым');
      } else {
        setError('Не удалось отправить отзыв. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div 
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="font-semibold text-lg">Отзыв</h2>
            <div className="w-8" />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Оцените объект</h3>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Комментарий</h3>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Расскажите о своих впечатлениях..."
                className="input-field min-h-[120px] resize-none"
                maxLength={500}
              />
              <div className="text-right text-sm text-gray-400 mt-1">
                {text.length}/500
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Фотографии</h3>
              <button
                type="button"
                className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-300 transition-colors"
              >
                <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 text-sm">
                  Нажмите, чтобы загрузить фото
                </p>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 safe-area-bottom">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary w-full"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
