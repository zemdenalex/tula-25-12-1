import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Review, useStore } from '../store';
import { HandThumbUpIcon, HandThumbDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as ThumbUpSolid, HandThumbDownIcon as ThumbDownSolid } from '@heroicons/react/24/solid';
import { StarIcon } from '@heroicons/react/24/solid';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { user, isAuthenticated, setReviewRank } = useStore();
  const [liked, setLiked] = React.useState(false);
  const [disliked, setDisliked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(review.like || 0);
  const [dislikeCount, setDislikeCount] = React.useState(review.dislike || 0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const reviewRating = review.rating || 0;

  const handleLike = async () => {
    if (!isAuthenticated || !user || !review.id) return;
    
    const newLiked = !liked;
    setLiked(newLiked);
    if (newLiked && disliked) {
      setDisliked(false);
      setDislikeCount(prev => prev - 1);
    }
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
    
    await setReviewRank(user.user_id, review.id, newLiked || undefined, undefined);
  };

  const handleDislike = async () => {
    if (!isAuthenticated || !user || !review.id) return;
    
    const newDisliked = !disliked;
    setDisliked(newDisliked);
    if (newDisliked && liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
    }
    setDislikeCount(prev => newDisliked ? prev + 1 : prev - 1);
    
    await setReviewRank(user.user_id, review.id, undefined, newDisliked || undefined);
  };

  return (
    <>
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <Link 
            to={review.id_user ? `/user/${review.id_user}` : '#'}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {review.user_name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{review.user_name || 'Пользователь'}</p>
            </div>
          </Link>
          
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                className={`w-4 h-4 ${star <= reviewRating ? 'text-amber-400' : 'text-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <p className="text-gray-700 mb-3">{review.text || 'Без текста'}</p>

        {review.review_photos && review.review_photos.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {review.review_photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhoto(photo)}
                className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              >
                <img
                  src={photo}
                  alt={`Фото ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-4 pt-2 border-t border-gray-100">
          <button
            onClick={handleLike}
            disabled={!isAuthenticated}
            className={`flex items-center space-x-1.5 transition-colors ${
              liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {liked ? (
              <ThumbUpSolid className="w-5 h-5" />
            ) : (
              <HandThumbUpIcon className="w-5 h-5" />
            )}
            <span className="text-sm">{likeCount}</span>
          </button>
          
          <button
            onClick={handleDislike}
            disabled={!isAuthenticated}
            className={`flex items-center space-x-1.5 transition-colors ${
              disliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {disliked ? (
              <ThumbDownSolid className="w-5 h-5" />
            ) : (
              <HandThumbDownIcon className="w-5 h-5" />
            )}
            <span className="text-sm">{dislikeCount}</span>
          </button>
        </div>
      </div>

      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <img
            src={selectedPhoto}
            alt="Увеличенное фото"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};

export default ReviewCard;