import { useState } from 'react';
import { Heart, MapPin, Users, Trophy, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store';
import type { UserPreferences } from '../types';

function OnboardingStep({ 
  step, 
  currentStep, 
  children 
}: { 
  step: number; 
  currentStep: number; 
  children: React.ReactNode;
}) {
  if (step !== currentStep) return null;
  return <>{children}</>;
}

export default function HomePage() {
  const { 
    setCurrentPage, 
    placeTypes, 
    setPreferences,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
    fetchPlaces
  } = useStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [characteristics, setCharacteristics] = useState({
    is_health: false,
    is_nosmoking: false,
    is_alcohol: false,
    is_smoke: false,
  });
  const [maxDistance, setMaxDistance] = useState(10);

  const placeTypesList = placeTypes?.place_type || [];

  const toggleType = (id: number) => {
    setSelectedTypes(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    const prefs: UserPreferences = {
      placeTypes: selectedTypes,
      characteristics,
      maxDistance,
    };
    setPreferences(prefs);
    await fetchPlaces();
    setCurrentPage('map');
  };

  const handleSkip = () => {
    setHasCompletedOnboarding(true);
    setCurrentPage('map');
  };

  if (hasCompletedOnboarding) {
    return (
      <div className="h-full overflow-y-auto bg-gradient-to-b from-primary-50 to-white pb-20">
        <div className="px-6 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Карта Здоровья</h1>
              <p className="text-gray-500">Тула</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => setCurrentPage('map')}
              className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <MapPin className="text-green-600" size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Исследовать карту</h3>
                <p className="text-sm text-gray-500">Найти здоровые места рядом</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>

            <button
              onClick={() => setCurrentPage('leaderboard')}
              className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Trophy className="text-yellow-600" size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Рейтинг</h3>
                <p className="text-sm text-gray-500">Топ активных пользователей</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>

            <button
              onClick={() => setCurrentPage('community')}
              className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Сообщество</h3>
                <p className="text-sm text-gray-500">Находите друзей и делитесь</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </button>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">О проекте</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Карта Здоровья — это интерактивная платформа для поиска и оценки мест в Туле 
              с точки зрения их влияния на здоровье. Отмечайте полезные места, оставляйте 
              отзывы и помогайте другим делать здоровый выбор.
            </p>
          </div>

          <button
            onClick={() => { setHasCompletedOnboarding(false); setCurrentStep(0); }}
            className="w-full mt-4 text-primary-600 text-sm font-medium"
          >
            Настроить персонализацию заново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white pb-20">
      <OnboardingStep step={0} currentStep={currentStep}>
        <div className="px-6 pt-12 pb-8 text-center">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="text-primary-600" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Карта Здоровья
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Добро пожаловать! Мы поможем вам найти полезные для здоровья места в Туле. 
            Давайте настроим приложение под ваши предпочтения.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="btn-primary w-full"
            >
              Начать настройку
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-3 text-gray-500 font-medium"
            >
              Пропустить
            </button>
          </div>
        </div>
      </OnboardingStep>

      <OnboardingStep step={1} currentStep={currentStep}>
        <div className="px-6 pt-8 pb-8">
          <div className="mb-6">
            <p className="text-sm text-primary-600 font-medium mb-2">Шаг 1 из 3</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Какие места вас интересуют?
            </h2>
            <p className="text-gray-500">
              Выберите типы мест, которые хотите видеть на карте
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {placeTypesList.map((type) => (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-colors ${
                  selectedTypes.includes(type.id)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{type.type}</span>
                  {selectedTypes.includes(type.id) && (
                    <Check size={18} className="text-primary-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(0)}
              className="btn-secondary flex-1"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className="btn-primary flex-1"
            >
              Далее
            </button>
          </div>
        </div>
      </OnboardingStep>

      <OnboardingStep step={2} currentStep={currentStep}>
        <div className="px-6 pt-8 pb-8">
          <div className="mb-6">
            <p className="text-sm text-primary-600 font-medium mb-2">Шаг 2 из 3</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Важные характеристики
            </h2>
            <p className="text-gray-500">
              Что для вас важно в местах?
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { key: 'is_health', label: 'Полезное для здоровья', icon: '💚', desc: 'Места с ЗОЖ-направленностью' },
              { key: 'is_nosmoking', label: 'Зоны без курения', icon: '🚭', desc: 'Чистый воздух' },
            ].map(({ key, label, icon, desc }) => (
              <button
                key={key}
                onClick={() => setCharacteristics(prev => ({ 
                  ...prev, 
                  [key]: !prev[key as keyof typeof characteristics] 
                }))}
                className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                  characteristics[key as keyof typeof characteristics]
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  {characteristics[key as keyof typeof characteristics] && (
                    <Check size={20} className="text-primary-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="btn-secondary flex-1"
            >
              Назад
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="btn-primary flex-1"
            >
              Далее
            </button>
          </div>
        </div>
      </OnboardingStep>

      <OnboardingStep step={3} currentStep={currentStep}>
        <div className="px-6 pt-8 pb-8">
          <div className="mb-6">
            <p className="text-sm text-primary-600 font-medium mb-2">Шаг 3 из 3</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Расстояние поиска
            </h2>
            <p className="text-gray-500">
              Максимальное расстояние от центра города
            </p>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">Расстояние</span>
              <span className="font-semibold text-primary-600">{maxDistance} км</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistance}
              onChange={(e) => setMaxDistance(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>1 км</span>
              <span>50 км</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="btn-secondary flex-1"
            >
              Назад
            </button>
            <button
              onClick={handleComplete}
              className="btn-primary flex-1"
            >
              Готово
            </button>
          </div>
        </div>
      </OnboardingStep>
    </div>
  );
}
