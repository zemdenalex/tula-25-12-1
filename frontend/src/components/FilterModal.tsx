import React, { useState } from 'react';
import { FiX, FiSliders } from 'react-icons/fi';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
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

const FilterModal: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onApply,
  initialFilters = defaultFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FiSliders className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Фильтры</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Максимальное расстояние: {filters.maxDistance} км
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(filters.maxDistance / 50) * 100}%, #e5e7eb ${(filters.maxDistance / 50) * 100}%, #e5e7eb 100%)`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип места</label>
            <select
              value={filters.placeType ?? ''}
              onChange={(e) => setFilters({ ...filters, placeType: e.target.value ? Number(e.target.value) : null })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Все типы</option>
              <option value="1">Спортзал</option>
              <option value="2">Парк</option>
              <option value="3">Бассейн</option>
              <option value="4">Стадион</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Опции</label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isHealth === true}
                onChange={(e) => setFilters({ ...filters, isHealth: e.target.checked ? true : null })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Здоровое питание</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isNosmoking === true}
                onChange={(e) => setFilters({ ...filters, isNosmoking: e.target.checked ? true : null })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Зона без курения</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isModerated === true}
                onChange={(e) => setFilters({ ...filters, isModerated: e.target.checked ? true : null })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Только проверенные</span>
            </label>
          </div>
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Сбросить
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;