import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import AuthModal from "../components/AuthModal";
import { FiSettings, FiStar, FiThumbsUp, FiUsers, FiChevronRight, FiLogIn, FiAward, FiLogOut, FiThumbsDown } from "react-icons/fi";
import { api } from "../api";

interface UserData {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
  rating: number;
}

interface Review {
  id: number;
  user_name: string;
  text: string;
  rating: number;
  like: number;
  dislike: number;
}

interface Achievement {
  id: number;
  name: string;
  icon: string;
  unlocked: boolean;
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const [achievements] = useState<Achievement[]>([
    { id: 1, name: 'Первый отзыв', icon: '📝', unlocked: true },
    { id: 2, name: '10 отзывов', icon: '🏆', unlocked: true },
    { id: 3, name: 'Популярный', icon: '⭐', unlocked: false },
    { id: 4, name: 'Эксперт', icon: '🎯', unlocked: false },
  ]);

  const [recentReviews] = useState<Review[]>([
    { id: 1, user_name: 'Ванечка Иванов', text: 'Классное место с кучей тренажеров, короче круто', rating: 4, like: 5, dislike: 1 },
    { id: 2, user_name: 'Ванечка Иванов', text: 'Классное место, короче круто', rating: 5, like: 3, dislike: 0 },
  ]);

  const level = Math.floor((user?.rating || 0) / 500) + 1;
  const currentLevelPoints = (user?.rating || 0) % 500;
  const pointsToNextLevel = 500;

  useEffect(() => {
    const checkAuth = async () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        setIsLoggedIn(true);
        await fetchUser(userId);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const response = await api.get(`/user/${userId}`);
      setUser(response.data);
      setEditName(response.data.name || '');
      setEditEmail(response.data.email || '');
      setEditPhone(response.data.phone || '');
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const handleAuthSuccess = (userId: number) => {
    localStorage.setItem('userId', userId.toString());
    setIsLoggedIn(true);
    setShowAuthModal(false);
    fetchUser(userId.toString());
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    setUser(null);
    setShowSettings(false);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await api.put('/user/update', {
        user_id: user.user_id,
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      setUser({ ...user, name: editName, email: editEmail, phone: editPhone });
      setShowSettings(false);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showSettings && user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10">
          <button onClick={() => setShowSettings(false)} className="text-blue-600">Отмена</button>
          <h1 className="text-lg font-semibold">Настройки</h1>
          <button onClick={handleSaveSettings} disabled={saving} className="text-blue-600 font-medium">
            {saving ? '...' : 'Сохранить'}
          </button>
        </header>

        <div className="p-4 space-y-4 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-4 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Имя</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Телефон</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-white text-red-600 py-4 rounded-2xl font-medium flex items-center justify-center gap-2"
          >
            <FiLogOut className="w-5 h-5" />
            Выйти из аккаунта
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10">
          <div className="w-10"></div>
          <h1 className="text-lg font-semibold">Профиль</h1>
          <div className="w-10"></div>
        </header>

        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <FiLogIn className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Войдите в аккаунт</h2>
          <p className="text-gray-500 text-center mb-6">
            Чтобы оставлять отзывы и участвовать в рейтинге
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Войти
          </button>
        </div>

        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
        )}

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10">
        <button className="p-2 hover:bg-gray-100 rounded-full">
          <FiUsers className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Профиль</h1>
        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 rounded-full">
          <FiSettings className="w-6 h-6" />
        </button>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-blue-600">{user?.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user?.name || 'Пользователь'}</h2>
              <p className="text-gray-500">{level} уровень</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">{Math.round((currentLevelPoints / pointsToNextLevel) * 100)}%</span>
                  <span><span className="text-blue-600 font-medium">{user?.rating || 0}</span> / {level * 500 + 500}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(currentLevelPoints / pointsToNextLevel) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiAward className="w-5 h-5 text-gray-400" />
              <span className="text-xl font-bold">{achievements.filter(a => a.unlocked).length}</span>
            </div>
            <p className="text-xs text-gray-500">Достижений</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiThumbsUp className="w-5 h-5 text-gray-400" />
              <span className="text-xl font-bold">15</span>
            </div>
            <p className="text-xs text-gray-500">Лайков</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FiUsers className="w-5 h-5 text-gray-400" />
              <span className="text-xl font-bold">1000</span>
            </div>
            <p className="text-xs text-gray-500">Подписчиков</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Достижения</h3>
            <button className="text-gray-400">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${
                  achievement.unlocked ? 'bg-blue-100' : 'bg-gray-100 opacity-50'
                }`}
              >
                {achievement.icon}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Последние отзывы</h3>
            <button className="text-gray-400">
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentReviews.map((review) => (
              <div key={review.id} className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{review.user_name}</p>
                    <p className="text-xs text-gray-400">3 уровень</p>
                  </div>
                  {renderStars(review.rating)}
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{review.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-gray-400">
                      <FiThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-1 text-gray-400">
                      <FiThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">24.09.25</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      )}

      <BottomNav />
    </div>
  );
};

export default ProfilePage;