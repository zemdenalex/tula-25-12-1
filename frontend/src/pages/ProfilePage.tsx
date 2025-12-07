import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import AuthModal from '../components/AuthModal';
import { FiSettings, FiStar, FiThumbsUp, FiUsers, FiChevronRight, FiLogIn } from 'react-icons/fi';
import { api } from '../api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
      setIsLoggedIn(true);
      fetchUser(parseInt(storedUserId));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (id: number) => {
    try {
      const data = await api.getUser(id);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (id: number) => {
    setUserId(id);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    localStorage.setItem('userId', id.toString());
    fetchUser(id);
  };

  const level = user?.rating ? Math.floor(user.rating / 500) + 1 : 1;
  const currentLevelPoints = (level - 1) * 500;
  const nextLevelPoints = level * 500;
  const progressPercent = user?.rating ? ((user.rating - currentLevelPoints) / 500) * 100 : 0;

  const mockStats = { achievements: 25, likes: 15, followers: 1000 };
  const mockAchievements = [
    { id: 1, icon: '🏆' },
    { id: 2, icon: '⭐' },
    { id: 3, icon: '🎯' },
    { id: 4, icon: '🔥' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white p-4 flex items-center justify-center">
          <h1 className="font-semibold text-lg">Профиль</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-[60vh] px-4">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FiLogIn className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Вы не авторизованы</h2>
          <p className="text-gray-500 text-center mb-6">Войдите, чтобы просматривать профиль</p>
          <button onClick={() => setShowAuthModal(true)} className="px-8 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600">
            Войти
          </button>
        </div>
        <BottomNav />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiUsers className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg">Профиль</h1>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiSettings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-start gap-4 mb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            {user?.photo ? (
              <img src={user.photo} alt="" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <FiUsers className="w-8 h-8 text-blue-400" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{user?.name || 'Пользователь'}</h2>
            <p className="text-gray-500 text-sm">{level} уровень</p>
            <div className="mt-2">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-400">{Math.round(progressPercent)}%</span>
                <span><span className="text-blue-500 font-medium">{user?.rating || 0}</span><span className="text-gray-400"> / {nextLevelPoints}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <FiStar className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{mockStats.achievements}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Достижений</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <FiThumbsUp className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{mockStats.likes}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Лайков</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <FiUsers className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{mockStats.followers}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Подписчиков</p>
          </div>
        </div>
      </div>

      <div className="bg-white mt-2 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Достижения</h3>
          <FiChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {mockAchievements.map((a) => (
            <div key={a.id} className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{a.icon}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white mt-2 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Последние отзывы</h3>
          <FiChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-gray-500 text-sm">Пока нет отзывов</p>
      </div>

      <BottomNav />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onSuccess={handleLoginSuccess} />
    </div>
  );
};

export default ProfilePage;