import React, { useState, useEffect } from 'react';
import { useStore, PlaceFilters } from '../store';
import { XMarkIcon, ChevronDownIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters, clearFilters, fetchPlacesWithFilters } = useStore();
  const [localFilters, setLocalFilters] = useState<PlaceFilters>(filters);
  const [minRating, setMinRating] = useState<number>(0);
  const [usefulnessRating, setUsefulnessRating] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters);
    }
  }, [isOpen, filters]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleApply = () => {
    setFilters(localFilters);
    fetchPlacesWithFilters(localFilters, true);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: PlaceFilters = {
      max_distance: 5,
      is_moderated: true,
    };
    setLocalFilters(defaultFilters);
    setMinRating(0);
    setUsefulnessRating([]);
    clearFilters();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleUsefulnessRating = (rating: string) => {
    setUsefulnessRating(prev => 
      prev.includes(rating) 
        ? prev.filter(r => r !== rating)
        : [...prev, rating]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={handleBackdropClick}>
      <div className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div 
          className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <button 
              onClick={onClose} 
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Фильтр</h2>
            <button 
              onClick={handleReset} 
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              Сбросить
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Категории</h3>
              <div className="relative">
                <select
                  value={localFilters.place_type || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    place_type: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="">Dropdown</option>
                  <option value="1">Спортзал</option>
                  <option value="2">Кафе</option>
                  <option value="3">Парк</option>
                  <option value="4">Магазин</option>
                  <option value="5">Бассейн</option>
                  <option value="6">Стадион</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Особенности</h3>
              <div className="space-y-4">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.is_nosmoking || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_nosmoking: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-gray-900">Запрещено курение</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.is_health || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_health: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-gray-900">Полезно для здоровья</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.is_smoke || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_smoke: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-gray-900">Табачные изделия</span>
                </label>
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.is_alcohol || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_alcohol: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="ml-3 text-gray-700 group-hover:text-gray-900">Алкоголь</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Пользовательский рейтинг</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="w-5 h-5 border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 flex items-center gap-2">
                      <span className="text-gray-700 group-hover:text-gray-900">
                        {rating} {rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звезд'}
                      </span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`w-4 h-4 ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Рейтинг полезности</h3>
              <div className="space-y-4">
                {['Отличное', 'Хорошее', 'Неплохое', 'Плохое', 'Ужасное'].map((rating) => (
                  <label key={rating} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={usefulnessRating.includes(rating)}
                      onChange={() => toggleUsefulnessRating(rating)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-3 text-gray-700 group-hover:text-gray-900">{rating}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                Расстояние до центра: <span className="text-blue-600">{localFilters.max_distance || 5} км</span>
              </h3>
              <div className="px-1">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={localFilters.max_distance || 5}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    max_distance: Number(e.target.value)
                  })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((localFilters.max_distance || 5) - 1) / 19 * 100}%, #e5e7eb ${((localFilters.max_distance || 5) - 1) / 19 * 100}%, #e5e7eb 100%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>1 км</span>
                <span>20 км</span>
              </div>
            </div>

            <div>
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localFilters.is_moderated || false}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    is_moderated: e.target.checked || null
                  })}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="ml-3 text-gray-700 group-hover:text-gray-900 font-medium">Только проверенные места</span>
              </label>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleApply}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors active:scale-[0.98]"
            >
              Применить фильтры
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;