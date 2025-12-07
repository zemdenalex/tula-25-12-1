import { useState } from 'react';
import { Search, UserPlus, Users, MessageCircle, Bell } from 'lucide-react';
import { useStore } from '../store';

const mockFriends = [
  { id: 1, name: 'Анна Петрова', status: 'online', rating: 150, lastActive: 'Сейчас в сети' },
  { id: 2, name: 'Дмитрий Иванов', status: 'offline', rating: 230, lastActive: '2 часа назад' },
  { id: 3, name: 'Елена Сидорова', status: 'online', rating: 180, lastActive: 'Сейчас в сети' },
  { id: 4, name: 'Михаил Козлов', status: 'offline', rating: 95, lastActive: 'Вчера' },
];

const mockRequests = [
  { id: 5, name: 'Ольга Новикова', rating: 120 },
  { id: 6, name: 'Сергей Морозов', rating: 200 },
];

type Tab = 'friends' | 'requests' | 'search';

export default function CommunityPage() {
  const { user, setAuthModalOpen } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
        <Users size={64} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Сообщество</h2>
        <p className="text-gray-500 text-center mb-6">
          Войдите, чтобы найти друзей и делиться открытиями
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Сообщество</h1>
        
        <div className="flex gap-2">
          {[
            { key: 'friends', label: 'Друзья', icon: <Users size={16} /> },
            { key: 'requests', label: 'Заявки', icon: <Bell size={16} />, badge: mockRequests.length },
            { key: 'search', label: 'Поиск', icon: <Search size={16} /> },
          ].map(({ key, label, icon, badge }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as Tab)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === key
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {icon}
              <span>{label}</span>
              {badge && badge > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === key ? 'bg-white/20' : 'bg-red-500 text-white'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {activeTab === 'friends' && (
          <div className="space-y-3">
            {mockFriends.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>У вас пока нет друзей</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 text-primary-600 font-medium"
                >
                  Найти друзей
                </button>
              </div>
            ) : (
              mockFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="card p-4 flex items-center gap-4"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                      {friend.name.charAt(0)}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{friend.name}</p>
                    <p className="text-sm text-gray-500">{friend.lastActive}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{friend.rating} очков</span>
                    <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                      <MessageCircle size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-3">
            {mockRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Bell size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Нет новых заявок</p>
              </div>
            ) : (
              mockRequests.map((request) => (
                <div
                  key={request.id}
                  className="card p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                    {request.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{request.name}</p>
                    <p className="text-sm text-gray-500">{request.rating} очков</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium">
                      Принять
                    </button>
                    <button className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                      Отклонить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="input-field pl-12"
              />
            </div>

            <div className="text-center py-8 text-gray-500">
              <Search size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Введите имя или email для поиска</p>
              <p className="text-sm mt-2">Функция в разработке</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
