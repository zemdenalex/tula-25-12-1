import { useState } from 'react';
import { FiX, FiSliders } from 'react-icons/fi';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: (filters: FilterState) => void;
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

const FilterPanel = ({ isOpen, onClose, onApply }: FilterPanelProps) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const placeTypes = [
    { id: 1, name: 'Спортзал' },
    { id: 2, name: 'Кафе' },
    { id: 3, name: 'Ресторан' },
    { id: 4, name: 'Парк' },
  ];

  const handleApply = () => {
    onApply?.(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:top-full md:left-0 md:right-0">
      <div className="absolute inset-0 bg-black bg-opacity-50 md:hidden" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl md:rounded-2xl md:relative md:mt-2 md:shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <FiSliders className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-lg">Фильтры</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX className="w-5 h-5" />
          </button>
        </div>

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
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500"
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

export default FilterPanel;