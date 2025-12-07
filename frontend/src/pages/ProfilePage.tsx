import { useState } from 'react';
import { Settings, Award, Star, MapPin, MessageSquare, LogOut, Edit, Trophy, Target, Zap } from 'lucide-react';
import { useStore } from '../store';

const mockAchievements = [
  { id: 1, icon: '🌟', name: 'Первый отзыв', description: 'Оставьте первый отзыв', earned: true },
  { id: 2, icon: '📍', name: 'Исследователь', description: 'Посетите 10 мест', earned: true },
  { id: 3, icon: '💚', name: 'ЗОЖник', description: 'Отметьте 5 здоровых мест', earned: false },
  { id: 4, icon: '🏆', name: 'Топ-10', description: 'Попадите в топ-10 рейтинга', earned: false },
  { id: 5, icon: '📸', name: 'Фотограф', description: 'Загрузите 20 фото', earned: false },
  { id: 6, icon: '👥', name: 'Социальный', description: 'Добавьте 5 друзей', earned: false },
];

export default function ProfilePage() {
  const { user, logout, setAuthModalOpen, setCurrentPage } = useStore();
  const [showAchievements, setShowAchievements] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
          <Settings size={40} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Профиль</h2>
        <p className="text-gray-500 text-center mb-6">
          Войдите, чтобы видеть свой профиль и достижения
        </p>
        <button
          onClick={() => setAuthModalOpen(true)}
          className="btn-primary"
        >
          Войти
        </button>
      </div>
    );
  }

  const earnedCount = mockAchievements.filter(a => a.earned).length;

  const handleSaveProfile = () => {
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      <div className="bg-primary-500 px-6 pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">Профиль</h1>
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="p-2 bg-white/20 rounded-xl text-white"
          >
            <Award size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-1 rounded-lg text-gray-900 text-lg font-semibold"
                />
                <button
                  onClick={handleSaveProfile}
                  className="px-3 py-1 bg-white/20 rounded-lg text-white text-sm"
                >
                  Сохранить
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">{user.name}</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-white/70 hover:text-white"
                >
                  <Edit size={16} />
                </button>
              </div>
            )}
            <p className="text-white/80">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Trophy size={20} className="text-yellow-500" />
                {user.rating || 0}
              </div>
              <p className="text-sm text-gray-500">Очков</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Star size={20} className="text-primary-500" />
                {earnedCount}
              </div>
              <p className="text-sm text-gray-500">Достижений</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <MapPin size={20} className="text-green-500" />
                12
              </div>
              <p className="text-sm text-gray-500">Мест</p>
            </div>
          </div>
        </div>

        {showAchievements && (
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Достижения</h3>
              <span className="text-sm text-gray-500">{earnedCount}/{mockAchievements.length}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {mockAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded-xl text-center ${
                    achievement.earned ? 'bg-primary-50' : 'bg-gray-100 opacity-50'
                  }`}
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <p className="text-xs font-medium text-gray-900 mt-1">{achievement.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="text-blue-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Мои отзывы</p>
              <p className="text-sm text-gray-500">Просмотреть все отзывы</p>
            </div>
          </button>

          <button className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="text-green-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Избранные места</p>
              <p className="text-sm text-gray-500">Сохраненные локации</p>
            </div>
          </button>

          <button className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Zap className="text-purple-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Активность</p>
              <p className="text-sm text-gray-500">История действий</p>
            </div>
          </button>

          <button className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Settings className="text-gray-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900">Настройки</p>
              <p className="text-sm text-gray-500">Персонализация и уведомления</p>
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <LogOut className="text-red-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-red-600">Выйти</p>
              <p className="text-sm text-gray-500">Выход из аккаунта</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
