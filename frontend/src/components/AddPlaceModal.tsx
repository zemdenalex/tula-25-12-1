import React, { useState } from 'react';
import { useStore } from '../store';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface AddPlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddPlaceModal: React.FC<AddPlaceModalProps> = ({ isOpen, onClose }) => {
  const { addPlace, isAuthenticated } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    info: '',
    coord1: 54.193122, // Default Tula coordinates
    coord2: 37.617348,
    type: 1,
    is_health: false,
    is_nosmoking: false,
    is_alcohol: false,
    is_smoke: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Необходимо войти в аккаунт');
      return;
    }

    if (!formData.name.trim()) {
      setError('Введите название места');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addPlace({
        name: formData.name.trim(),
        info: formData.info.trim() || undefined,
        coord1: formData.coord1,
        coord2: formData.coord2,
        type: formData.type,
        is_health: formData.is_health,
        is_nosmoking: formData.is_nosmoking,
        is_alcohol: formData.is_alcohol,
        is_smoke: formData.is_smoke,
      });

      if (result) {
        setFormData({
          name: '',
          info: '',
          coord1: 54.193122,
          coord2: 37.617348,
          type: 1,
          is_health: false,
          is_nosmoking: false,
          is_alcohol: false,
          is_smoke: false,
        });
        onClose();
      } else {
        setError('Не удалось добавить место');
      }
    } catch (err) {
      setError('Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center md:p-4">
        <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Добавить место</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!isAuthenticated && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
                Войдите в аккаунт, чтобы добавлять места
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Название места"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                value={formData.info}
                onChange={(e) => setFormData({ ...formData, info: e.target.value })}
                rows={3}
                className="input resize-none"
                placeholder="Опишите это место..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Широта
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coord1}
                  onChange={(e) => setFormData({ ...formData, coord1: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Долгота
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.coord2}
                  onChange={(e) => setFormData({ ...formData, coord2: parseFloat(e.target.value) })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип места
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) })}
                className="input"
              >
                <option value={1}>Спортзал</option>
                <option value={2}>Кафе</option>
                <option value={3}>Парк</option>
                <option value={4}>Магазин</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Особенности
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_health}
                    onChange={(e) => setFormData({ ...formData, is_health: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Полезно для здоровья</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_nosmoking}
                    onChange={(e) => setFormData({ ...formData, is_nosmoking: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Запрещено курение</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_alcohol}
                    onChange={(e) => setFormData({ ...formData, is_alcohol: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Продажа алкоголя</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_smoke}
                    onChange={(e) => setFormData({ ...formData, is_smoke: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">Табачные изделия</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isAuthenticated}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors"
            >
              {isSubmitting ? 'Добавление...' : 'Добавить место'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;