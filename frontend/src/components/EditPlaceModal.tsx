import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { placesApi } from '../api';
import type { PlaceCreateData, ProductData, EquipmentData } from '../types';

export default function EditPlaceModal() {
  const { 
    isEditPlaceModalOpen, 
    setEditPlaceModalOpen,
    selectedPlace,
    placeTypes,
    fetchPlaces,
    refreshSelectedPlace
  } = useStore();

  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [info, setInfo] = useState('');
  const [flags, setFlags] = useState({
    is_health: false,
    is_nosmoking: false,
    is_alcohol: false,
    is_smoke: false,
    is_insurance: false,
  });

  const [newProducts, setNewProducts] = useState<ProductData[]>([]);
  const [newEquipment, setNewEquipment] = useState<EquipmentData[]>([]);

  useEffect(() => {
    if (selectedPlace && isEditPlaceModalOpen) {
      setInfo(selectedPlace.info || '');
      setFlags({
        is_health: selectedPlace.is_health || false,
        is_nosmoking: selectedPlace.is_nosmoking || false,
        is_alcohol: selectedPlace.is_alcohol || false,
        is_smoke: selectedPlace.is_smoke || false,
        is_insurance: selectedPlace.is_insurance || false,
      });
    }
  }, [selectedPlace, isEditPlaceModalOpen]);

  if (!isEditPlaceModalOpen || !selectedPlace) return null;

  const handleClose = () => {
    setEditPlaceModalOpen(false);
    setNewProducts([]);
    setNewEquipment([]);
    setIsAdvanced(false);
    setError('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const placeData: PlaceCreateData = {
        info: info.trim() || undefined,
        ...flags,
        products: newProducts.length > 0 ? newProducts : undefined,
        equipment: newEquipment.length > 0 ? newEquipment : undefined,
      };

      await placesApi.update(selectedPlace.id!, placeData);
      await fetchPlaces();
      await refreshSelectedPlace();
      handleClose();
    } catch (err) {
      console.error('Failed to update place:', err);
      setError('Не удалось обновить информацию. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addProduct = () => {
    setNewProducts([...newProducts, { name: '', is_health: false }]);
  };

  const updateProduct = (index: number, field: keyof ProductData, value: any) => {
    const updated = [...newProducts];
    updated[index] = { ...updated[index], [field]: value };
    setNewProducts(updated);
  };

  const removeProduct = (index: number) => {
    setNewProducts(newProducts.filter((_, i) => i !== index));
  };

  const addEquipment = () => {
    setNewEquipment([...newEquipment, { name: '', count: 1 }]);
  };

  const updateEquipment = (index: number, field: keyof EquipmentData, value: any) => {
    const updated = [...newEquipment];
    updated[index] = { ...updated[index], [field]: value };
    setNewEquipment(updated);
  };

  const removeEquipment = (index: number) => {
    setNewEquipment(newEquipment.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />
      
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
        <div 
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <button onClick={handleClose} className="p-2 -ml-2 text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
            <h2 className="font-semibold text-lg">Редактировать место</h2>
            <div className="w-8" />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="font-medium text-gray-900">{selectedPlace.name}</p>
              <p className="text-sm text-gray-500">{selectedPlace.type}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  placeholder="Расскажите о месте..."
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Характеристики
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'is_health', label: 'Здоровое', icon: '💚' },
                    { key: 'is_nosmoking', label: 'Без курения', icon: '🚭' },
                    { key: 'is_alcohol', label: 'Алкоголь', icon: '🍺' },
                    { key: 'is_smoke', label: 'Курение', icon: '🚬' },
                    { key: 'is_insurance', label: 'Страхование', icon: '🛡️' },
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFlags(prev => ({ ...prev, [key]: !prev[key as keyof typeof flags] }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                        flags[key as keyof typeof flags]
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span>{icon}</span>
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedPlace.products && selectedPlace.products.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Существующие продукты
                  </label>
                  <div className="space-y-1">
                    {selectedPlace.products.map((product, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {product.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlace.equipment && selectedPlace.equipment.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Существующее оборудование
                  </label>
                  <div className="space-y-1">
                    {selectedPlace.equipment.map((eq, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {eq.name} {eq.count && `(${eq.count})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAdvanced(!isAdvanced)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Добавить данные</span>
                {isAdvanced ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>

              {isAdvanced && (
                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Новые продукты</label>
                      <button
                        type="button"
                        onClick={addProduct}
                        className="text-primary-600 text-sm font-medium"
                      >
                        + Добавить
                      </button>
                    </div>
                    {newProducts.map((product, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          placeholder="Название продукта"
                          className="input-field flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeProduct(index)}
                          className="p-2 text-red-500"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Новое оборудование</label>
                      <button
                        type="button"
                        onClick={addEquipment}
                        className="text-primary-600 text-sm font-medium"
                      >
                        + Добавить
                      </button>
                    </div>
                    {newEquipment.map((eq, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={eq.name || ''}
                          onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                          placeholder="Название"
                          className="input-field flex-1"
                        />
                        <input
                          type="number"
                          value={eq.count || 1}
                          onChange={(e) => updateEquipment(index, 'count', parseInt(e.target.value))}
                          placeholder="Кол-во"
                          className="input-field w-20"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => removeEquipment(index)}
                          className="p-2 text-red-500"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 safe-area-bottom">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={20} className="animate-spin" />}
              {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
