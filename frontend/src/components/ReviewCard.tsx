import React from 'react';
import { Link } from 'react-router-dom';
import { Review, useStore } from '../store';
import { HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';
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
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      {/* Header */}
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
            <p className="text-xs text-gray-500">3 уровень</p>
          </div>
        </Link>
        
        {/* Stars - placeholder */}
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              className={`w-4 h-4 ${star <= 4 ? 'text-amber-400' : 'text-gray-200'}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-700 mb-3">{review.text || 'Без текста'}</p>

      {/* Photos */}
      {review.review_photos && review.review_photos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.review_photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Фото ${index + 1}`}
              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Actions */}
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
  );
};

export default ReviewCard;