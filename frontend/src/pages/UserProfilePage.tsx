import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { FiChevronLeft, FiStar, FiThumbsUp, FiUsers, FiAward, FiUserPlus, FiUserCheck } from 'react-icons/fi';
import { api } from '../api';

interface UserData {
  user_id: number;
  name: string;
  email: string;
  phone: string;
  photo: string;
  rating: number;
}

interface Achievement {
  id: number;
  name: string;
  icon: string;
  unlocked: boolean;
}

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [achievements] = useState<Achievement[]>([
    { id: 1, name: 'Первый отзыв', icon: '📝', unlocked: true },
    { id: 2, name: '10 отзывов', icon: '🏆', unlocked: true },
    { id: 3, name: 'Популярный', icon: '⭐', unlocked: false },
    { id: 4, name: 'Эксперт', icon: '🎯', unlocked: false },
  ]);

  const level = Math.floor((user?.rating || 0) / 500) + 1;
  const currentLevelPoints = (user?.rating || 0) % 500;
  const pointsToNextLevel = 500;

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/user/${id}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId || !id) return;

    setFollowLoading(true);
    try {
      await api.post('/user/follow/', {
        user_id: parseInt(currentUserId),
        follow_id: parseInt(id),
      });
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Пользователь не найден</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-3 flex items-center gap-3 border-b sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
          <FiChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Профиль</h1>
      </header>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-4 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-blue-600">{user.name?.charAt(0) || '?'}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-500">{level} уровень</p>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">{Math.round((currentLevelPoints / pointsToNextLevel) * 100)}%</span>
                  <span><span className="text-blue-600 font-medium">{user.rating || 0}</span> / {level * 500 + 500}</span>
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

          <button
            onClick={handleFollow}
            disabled={followLoading}
            className={`w-full mt-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
              isFollowing 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isFollowing ? (
              <>
                <FiUserCheck className="w-5 h-5" />
                Вы подписаны
              </>
            ) : (
              <>
                <FiUserPlus className="w-5 h-5" />
                Подписаться
              </>
            )}
          </button>
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

        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Достижения</h3>
            <button className="text-sm text-blue-600">Все</button>
          </div>
          <div className="flex gap-3">
            {achievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl ${
                  achievement.unlocked ? 'bg-blue-100' : 'bg-gray-100 opacity-50'
                }`}
              >
                {achievement.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default UserProfilePage;