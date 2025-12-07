import React, { useState } from 'react';
<<<<<<< HEAD
import { FiX, FiSliders } from 'react-icons/fi';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
  filters?: FilterState;
  setFilters?: (filters: FilterState) => void;
}

export interface FilterState {
  placeType: number | null;
  isAlcohol: boolean | null;
  isHealth: boolean | null;
  isNosmoking: boolean | null;
  isSmoke: boolean | null;
  maxDistance: number;
  isModerated: boolean | null;
}

const defaultFilters: FilterState = {
  placeType: null,
  isAlcohol: null,
  isHealth: null,
  isNosmoking: null,
  isSmoke: null,
  maxDistance: 5,
  isModerated: null,
};

const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onApply,
  filters: externalFilters,
  setFilters: setExternalFilters,
}) => {
  const [internalFilters, setInternalFilters] = useState<FilterState>(defaultFilters);
  const filters = externalFilters || internalFilters;
  const setFilters = setExternalFilters || setInternalFilters;

  const placeTypes = [
    { id: 1, name: 'Спортзал' },
    { id: 2, name: 'Кафе' },
    { id: 3, name: 'Ресторан' },
    { id: 4, name: 'Парк' },
  ];

  const handleApply = () => {
    onApply?.(filters);
=======
import { useStore, PlaceFilters } from '../store';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
  const { filters, setFilters, clearFilters, fetchPlacesWithFilters } = useStore();
  const [localFilters, setLocalFilters] = useState<PlaceFilters>(filters);
  const [minRating, setMinRating] = useState<number>(0);

  const handleApply = () => {
    setFilters(localFilters);
    fetchPlacesWithFilters(localFilters, true); // reset = true to start from page 1
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
    onClose();
  };

  const handleReset = () => {
<<<<<<< HEAD
    setFilters(defaultFilters);
=======
    const defaultFilters: PlaceFilters = {
      max_distance: 5,
      is_moderated: true,
    };
    setLocalFilters(defaultFilters);
    setMinRating(0);
    clearFilters();
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
  };

  if (!isOpen) return null;

  return (
<<<<<<< HEAD
    <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:top-full md:left-0 md:right-0">
      <div className="absolute inset-0 bg-black bg-opacity-50 md:hidden" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl md:rounded-2xl md:relative md:mt-2 md:shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <FiSliders className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-lg">Фильтры</h3>
=======
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <button onClick={onClose} className="p-2 -ml-2 text-gray-500 hover:text-gray-700">
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Фильтр</h2>
            <button onClick={handleReset} className="text-blue-600 font-medium">
              Сбросить
            </button>
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX className="w-5 h-5" />
          </button>
        </div>

<<<<<<< HEAD
        <div className="p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Тип заведения</label>
            <div className="flex flex-wrap gap-2">
              {placeTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setFilters({ ...filters, placeType: filters.placeType === type.id ? null : type.id })}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    filters.placeType === type.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Расстояние до центра: {filters.maxDistance} км
            </label>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: parseFloat(e.target.value) })}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((filters.maxDistance - 0.5) / 19.5) * 100}%, #E5E7EB ${((filters.maxDistance - 0.5) / 19.5) * 100}%, #E5E7EB 100%)`,
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5 км</span>
              <span>20 км</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Особенности</label>
            {[
              { key: 'isHealth', label: 'Здоровое питание' },
              { key: 'isNosmoking', label: 'Для некурящих' },
              { key: 'isSmoke', label: 'Зона для курения' },
              { key: 'isAlcohol', label: 'Алкоголь' },
              { key: 'isModerated', label: 'Проверенные' },
            ].map((option) => (
              <label key={option.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">{option.label}</span>
                <input
                  type="checkbox"
                  checked={filters[option.key as keyof FilterState] === true}
                  onChange={(e) => setFilters({ ...filters, [option.key]: e.target.checked ? true : null })}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                />
              </label>
            ))}
=======
          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Категории</h3>
              <div className="relative">
                <select
                  value={localFilters.place_type || ''}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    place_type: e.target.value ? Number(e.target.value) : null
                  })}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все категории</option>
                  <option value="1">Спортзал</option>
                  <option value="2">Кафе</option>
                  <option value="3">Парк</option>
                  <option value="4">Магазин</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Особенности</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.is_nosmoking || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_nosmoking: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Запрещено курение</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.is_health || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_health: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Полезно для здоровья</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.is_smoke || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_smoke: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Табачные изделия</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localFilters.is_alcohol || false}
                    onChange={(e) => setLocalFilters({
                      ...localFilters,
                      is_alcohol: e.target.checked || null
                    })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Алкоголь</span>
                </label>
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Пользовательский рейтинг</h3>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="w-5 h-5 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 flex items-center">
                      <span className="text-gray-700 mr-2">{rating} {rating === 1 ? 'звезда' : rating < 5 ? 'звезды' : 'звезд'}</span>
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

            {/* Distance */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">
                Расстояние до центра: {localFilters.max_distance || 5} км
              </h3>
              <input
                type="range"
                min="1"
                max="20"
                value={localFilters.max_distance || 5}
                onChange={(e) => setLocalFilters({
                  ...localFilters,
                  max_distance: Number(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1 км</span>
                <span>20 км</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleApply}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              Применить фильтры
            </button>
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-4 border-t flex gap-3">
          <button onClick={handleReset} className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
            Сбросить
          </button>
          <button onClick={handleApply} className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

<<<<<<< HEAD
export default FilterPanel;
=======
export default FilterModal;
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
