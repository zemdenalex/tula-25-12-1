import { useState } from 'react';
import { X, Star, Camera, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { reviewsApi, photoApi } from '../api';

export default function ReviewForm() {
  const { 
    isReviewFormOpen, 
    setReviewFormOpen, 
    selectedPlace, 
    user,
    refreshSelectedPlace
  } = useStore();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isReviewFormOpen || !selectedPlace || !user) return null;

  const handleClose = () => {
    setReviewFormOpen(false);
    setRating(0);
    setText('');
    setPhotos([]);
    setError('');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const uploadPromises = Array.from(files).map(file => photoApi.upload(file));
      const urls = await Promise.all(uploadPromises);
      setPhotos(prev => [...prev, ...urls]);
    } catch (err) {
      console.error('Failed to upload photos:', err);
      setError('Не удалось загрузить фото');
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
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
        rating: rating,
        photos: photos.length > 0 ? photos : undefined,
      });
      
      await refreshSelectedPlace();
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
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="font-semibold text-lg">Написать отзыв</h2>
            <div className="w-8" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Place name */}
            <div className="mb-6 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500">Отзыв на</p>
              <p className="font-medium text-gray-900">{selectedPlace.name}</p>
            </div>

            {/* Rating */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Ваша оценка</h3>
              <div className="flex gap-2 justify-center">
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
                      size={40}
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

            {/* Comment */}
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

            {/* Photos */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Фотографии</h3>
              
              {/* Uploaded photos */}
              {photos.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img 
                        src={url} 
                        alt={`Фото ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-gray-300 transition-colors cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="mx-auto text-gray-400 animate-spin" size={32} />
                  ) : (
                    <Camera className="mx-auto text-gray-400" size={32} />
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    {isUploading ? 'Загрузка...' : 'Нажмите для загрузки фото'}
                  </p>
                </div>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 safe-area-bottom">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isUploading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={20} className="animate-spin" />}
              {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
