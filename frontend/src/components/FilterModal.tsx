import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '../store';
import type { SearchFilters } from '../types';

export default function FilterModal() {
  const { 
    isFilterModalOpen, 
    setFilterModalOpen, 
    filters, 
    placeTypes,
    searchPlaces,
    fetchPlaces
  } = useStore();
  
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (!isFilterModalOpen) return null;

  const handleClose = () => {
    setFilterModalOpen(false);
  };

  const handleApply = async () => {
    const hasFilters = Object.values(localFilters).some(v => v !== undefined && v !== null);
    
    if (hasFilters) {
      await searchPlaces(localFilters);
    } else {
      await fetchPlaces();
    }
    
    handleClose();
  };

  const handleReset = () => {
    setLocalFilters({ is_moderated: true, max_distance: 50 });
  };

  const togglePlaceType = (typeId: number) => {
    setLocalFilters(prev => ({
      ...prev,
      place_type: prev.place_type === typeId ? undefined : typeId
    }));
  };

  const toggleBoolFilter = (key: keyof SearchFilters) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key] === true ? undefined : true
    }));
  };

  const placeTypesList = placeTypes?.place_type || [];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div 
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <button
              onClick={handleClose}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h2 className="font-semibold text-lg">Фильтры</h2>
            <button
              onClick={handleReset}
              className="text-primary-600 text-sm font-medium"
            >
              Сбросить
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Тип объекта</h3>
              <div className="flex flex-wrap gap-2">
                {placeTypesList.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => togglePlaceType(type.id)}
                    className={`tag transition-colors ${
                      localFilters.place_type === type.id
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type.type}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Характеристики</h3>
              <div className="space-y-2">
                <FilterCheckbox
                  checked={localFilters.is_health === true}
                  onChange={() => toggleBoolFilter('is_health')}
                  label="Полезное для здоровья"
                  icon="💚"
                />
                <FilterCheckbox
                  checked={localFilters.is_nosmoking === true}
                  onChange={() => toggleBoolFilter('is_nosmoking')}
                  label="Зона без курения"
                  icon="🚭"
                />
                <FilterCheckbox
                  checked={localFilters.is_alcohol === true}
                  onChange={() => toggleBoolFilter('is_alcohol')}
                  label="С алкоголем"
                  icon="🍺"
                />
                <FilterCheckbox
                  checked={localFilters.is_smoke === true}
                  onChange={() => toggleBoolFilter('is_smoke')}
                  label="Разрешено курение"
                  icon="🚬"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">
                Расстояние от центра: {localFilters.max_distance || 50} км
              </h3>
              <input
                type="range"
                min="1"
                max="100"
                value={localFilters.max_distance || 50}
                onChange={(e) => setLocalFilters(prev => ({
                  ...prev,
                  max_distance: parseInt(e.target.value)
                }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>1 км</span>
                <span>100 км</span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 safe-area-bottom">
            <button
              onClick={handleApply}
              className="btn-primary w-full"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterCheckbox({ 
  checked, 
  onChange, 
  label, 
  icon 
}: { 
  checked: boolean; 
  onChange: () => void; 
  label: string; 
  icon: string;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1 text-left text-gray-700">{label}</span>
      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
        checked 
          ? 'bg-primary-500 border-primary-500' 
          : 'border-gray-300'
      }`}>
        {checked && <Check size={16} className="text-white" />}
      </div>
    </button>
  );
}
