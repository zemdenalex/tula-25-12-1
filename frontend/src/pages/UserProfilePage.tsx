<<<<<<< HEAD
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import AuthModal from '../components/AuthModal';
import { FiArrowLeft, FiUsers, FiStar, FiThumbsUp, FiChevronRight, FiUserPlus } from 'react-icons/fi';
import { api } from '../api';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (id) {
      api.getUser(parseInt(id))
        .then(setUser)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleFollow = async () => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) { setShowAuthModal(true); return; }
    try {
      await api.followUser(parseInt(currentUserId), parseInt(id!));
      setIsFollowing(true);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const level = user?.rating ? Math.floor(user.rating / 500) + 1 : 1;
  const nextLevelPoints = level * 500;
  const progressPercent = user?.rating ? ((user.rating - (level - 1) * 500) / 500) * 100 : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full"><FiArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-semibold text-lg">Профиль</h1>
        </div>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center">
            {user?.photo ? <img src={user.photo} alt="" className="w-full h-full object-cover rounded-xl" /> : <FiUsers className="w-8 h-8 text-blue-400" />}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{user?.name || 'Пользователь'}</h2>
            <p className="text-gray-500 text-sm">{level} уровень</p>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">{Math.round(progressPercent)}%</span>
                <span><span className="text-blue-500 font-medium">{user?.rating || 0}</span><span className="text-gray-400"> / {nextLevelPoints}</span></span>
              </div>
=======
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
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <button onClick={handleFollow} disabled={isFollowing} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 ${isFollowing ? 'bg-gray-100 text-gray-500' : 'bg-blue-500 text-white hover:bg-blue-600'}`}>
          <FiUserPlus className="w-5 h-5" />{isFollowing ? 'Подписан' : 'Подписаться'}
        </button>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1"><FiStar className="w-4 h-4 text-gray-400" /><span className="font-semibold">25</span></div>
            <p className="text-xs text-gray-500 mt-1">Достижений</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1"><FiThumbsUp className="w-4 h-4 text-gray-400" /><span className="font-semibold">15</span></div>
            <p className="text-xs text-gray-500 mt-1">Лайков</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1"><FiUsers className="w-4 h-4 text-gray-400" /><span className="font-semibold">1000</span></div>
            <p className="text-xs text-gray-500 mt-1">Подписчиков</p>
          </div>
        </div>
      </div>

      <div className="bg-white mt-2 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Достижения</h3>
          <FiChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex gap-3">
          {['🏆', '⭐', '🎯', '🔥'].map((icon, i) => (
            <div key={i} className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center"><span className="text-2xl">{icon}</span></div>
          ))}
        </div>
      </div>

      <BottomNav />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={(id) => { setShowAuthModal(false); localStorage.setItem('userId', id.toString()); }} />
    </div>
  );
};

export default UserProfilePage;
=======
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
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
