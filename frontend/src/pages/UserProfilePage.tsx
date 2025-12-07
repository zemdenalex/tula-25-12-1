import { ArrowLeft, UserPlus, Trophy, Star, MapPin, MessageCircle } from 'lucide-react';
import { useStore } from '../store';

export default function UserProfilePage() {
  const { viewedUser, setCurrentPage, user, setAuthModalOpen } = useStore();

  if (!viewedUser) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Пользователь не найден</p>
      </div>
    );
  }

  const handleAddFriend = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    alert('Заявка отправлена!');
  };

  const handleMessage = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    alert('Функция в разработке');
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      <div className="bg-primary-500 px-6 pt-6 pb-12">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setCurrentPage('leaderboard')}
            className="p-2 bg-white/20 rounded-xl text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">Профиль</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-primary-600 text-2xl font-bold">
            {viewedUser.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-white">{viewedUser.name || 'Пользователь'}</h2>
            <p className="text-white/80">Участник сообщества</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6">
        <div className="card p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Trophy size={20} className="text-yellow-500" />
                {viewedUser.rating || 0}
              </div>
              <p className="text-sm text-gray-500">Очков</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <Star size={20} className="text-primary-500" />
                8
              </div>
              <p className="text-sm text-gray-500">Отзывов</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-2xl font-bold text-gray-900">
                <MapPin size={20} className="text-green-500" />
                15
              </div>
              <p className="text-sm text-gray-500">Мест</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleAddFriend}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <UserPlus size={18} />
            Добавить в друзья
          </button>
          <button
            onClick={handleMessage}
            className="p-3 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <MessageCircle size={20} />
          </button>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Достижения</h3>
          <div className="flex flex-wrap gap-2">
            {['🌟', '📍', '💚'].map((emoji, index) => (
              <div key={index} className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-xl">
                {emoji}
              </div>
            ))}
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
              +5
            </div>
          </div>
        </div>

        <div className="card p-4 mt-4">
          <h3 className="font-semibold text-gray-900 mb-4">Последние отзывы</h3>
          <div className="text-center py-4 text-gray-500 text-sm">
            Нет доступных отзывов
          </div>
        </div>
      </div>
    </div>
  );
}
