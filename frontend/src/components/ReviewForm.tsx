import React, { useState } from 'react';
import { useStore, uploadPhoto } from '../store';
import { StarIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface ReviewFormProps {
  placeId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ placeId, onSuccess, onCancel }) => {
  const { user, isAuthenticated, addReview } = useStore();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setPhotoFiles(prev => [...prev, ...newFiles]);
    
    // Create preview URLs
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPhotos(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setError('Необходимо войти в аккаунт');
      return;
    }

    if (rating === 0) {
      setError('Выберите рейтинг');
      return;
    }

    if (!message.trim()) {
      setError('Напишите отзыв');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Upload photos first if any
      let uploadedPhotoUrls: string[] = [];
      if (photoFiles.length > 0) {
        setUploadingPhotos(true);
        for (const file of photoFiles) {
          const url = await uploadPhoto(file);
          if (url) {
            uploadedPhotoUrls.push(url);
          }
        }
        setUploadingPhotos(false);
      }

      const success = await addReview({
        message: message.trim(),
        user_id: user.user_id,
        place_id: placeId,
        rating,
        photos: uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : undefined,
      });

      if (success) {
        setRating(0);
        setMessage('');
        setPhotos([]);
        setPhotoFiles([]);
        onSuccess?.();
      } else {
        setError('Не удалось отправить отзыв');
      }
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setError('Произошла ошибка при отправке отзыва');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center">
        <p className="text-gray-600">Войдите, чтобы оставить отзыв</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ваша оценка
        </label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              {star <= (hoverRating || rating) ? (
                <StarIconSolid className="w-8 h-8 text-amber-400" />
              ) : (
                <StarIcon className="w-8 h-8 text-gray-300" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Review text */}
      <div>
        <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
          Ваш отзыв
        </label>
        <textarea
          id="review"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="input resize-none"
          placeholder="Расскажите о своем опыте..."
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Фотографии (необязательно)
        </label>
        
        {photos.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {photos.map((photo, index) => (
              <div key={index} className="relative w-20 h-20">
                <img
                  src={photo}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <div className="flex items-center space-x-2 text-gray-500">
            <PhotoIcon className="w-6 h-6" />
            <span>Добавить фото</span>
          </div>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting || uploadingPhotos}
          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {uploadingPhotos ? 'Загрузка фото...' : isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;