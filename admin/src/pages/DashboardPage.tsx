import { useEffect, useState } from 'react';
import { LogOut, MapPin, Users, Shield, Check, X, Trash2, MinusCircle, PlusCircle, Ban } from 'lucide-react';
import { useAdminStore } from '../store';

export default function DashboardPage() {
  const { 
    logout, places, users, fetchPlaces, fetchUsers, 
    verifyPlace, updateUserRating, banUser, deleteReview,
    createAdmin, activeTab, setActiveTab, error, setError, isLoading
  } = useAdminStore();

  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', password: '' });
  const [ratingChange, setRatingChange] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    fetchPlaces();
    fetchUsers();
  }, []);

  const handleVerify = async (id: number, verify: boolean) => {
    await verifyPlace(id, verify);
  };

  const handleRatingChange = async (userId: number) => {
    const change = ratingChange[userId];
    if (change) {
      await updateUserRating(userId, change);
      setRatingChange(prev => ({ ...prev, [userId]: 0 }));
    }
  };

  const handleBan = async (userId: number) => {
    if (confirm('Забанить пользователя?')) {
      await banUser(userId);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (confirm('Удалить отзыв?')) {
      await deleteReview(reviewId);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAdmin(newAdminForm.name, newAdminForm.email, newAdminForm.password);
    setNewAdminForm({ name: '', email: '', password: '' });
    alert('Админ создан!');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Админ-панель</h1>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            <LogOut size={20} />
            Выйти
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <TabButton 
            active={activeTab === 'places'} 
            onClick={() => setActiveTab('places')}
            icon={<MapPin size={18} />}
            label="Места"
            count={places.length}
          />
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
            icon={<Users size={18} />}
            label="Пользователи"
            count={users.length}
          />
          <TabButton 
            active={activeTab === 'admins'} 
            onClick={() => setActiveTab('admins')}
            icon={<Shield size={18} />}
            label="Администраторы"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 flex items-center justify-between">
            {error}
            <button onClick={() => setError(null)}><X size={18} /></button>
          </div>
        )}

        {/* Places Tab */}
        {activeTab === 'places' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Управление местами</h2>
              <p className="text-sm text-gray-500">Верификация и модерация объектов</p>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Загрузка...</div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {places.map(place => (
                  <div key={place.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">{place.name || 'Без названия'}</span>
                          {place.is_moderated && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">✓ Проверено</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{place.type || 'Тип не указан'}</p>
                        <div className="flex gap-4 mt-1 text-sm text-gray-400">
                          <span>Health: {place.rating || 0}%</span>
                          <span>Rating: {place.review_rank?.toFixed(1) || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {place.is_moderated ? (
                          <button
                            onClick={() => handleVerify(place.id, false)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Снять верификацию"
                          >
                            <X size={20} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerify(place.id, true)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Верифицировать"
                          >
                            <Check size={20} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {places.length === 0 && (
                  <div className="p-8 text-center text-gray-500">Нет мест</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Управление пользователями</h2>
              <p className="text-sm text-gray-500">Рейтинг и баны</p>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {users.map(user => (
                <div key={user.user_id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900">{user.name || 'Без имени'}</span>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-400">Рейтинг: {user.rating || 0}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setRatingChange(prev => ({ ...prev, [user.user_id]: (prev[user.user_id] || 0) - 10 }))}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <MinusCircle size={18} />
                        </button>
                        <input
                          type="number"
                          value={ratingChange[user.user_id] || 0}
                          onChange={(e) => setRatingChange(prev => ({ ...prev, [user.user_id]: parseInt(e.target.value) || 0 }))}
                          className="w-16 text-center border border-gray-200 rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => setRatingChange(prev => ({ ...prev, [user.user_id]: (prev[user.user_id] || 0) + 10 }))}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <PlusCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleRatingChange(user.user_id)}
                          className="px-2 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700"
                        >
                          OK
                        </button>
                      </div>
                      <button
                        onClick={() => handleBan(user.user_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Забанить"
                      >
                        <Ban size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-8 text-center text-gray-500">Нет пользователей</div>
              )}
            </div>
          </div>
        )}

        {/* Admins Tab */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold">Создать администратора</h2>
              <p className="text-sm text-gray-500">Добавить нового админа</p>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input
                  type="text"
                  value={newAdminForm.name}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <input
                  type="password"
                  value={newAdminForm.password}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700"
              >
                Создать администратора
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label, count }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active 
          ? 'bg-primary-600 text-white' 
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${
          active ? 'bg-white/20' : 'bg-gray-100'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}
