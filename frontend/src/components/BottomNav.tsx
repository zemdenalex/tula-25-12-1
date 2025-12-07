import { useLocation, useNavigate } from 'react-router-dom';
import { FiMap, FiAward, FiUsers, FiUser } from 'react-icons/fi';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', icon: FiMap, label: 'Объекты' },
    { path: '/leaderboard', icon: FiAward, label: 'Рейтинг' },
    { path: '/community', icon: FiUsers, label: 'Сообщество' },
    { path: '/profile', icon: FiUser, label: 'Профиль' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 pb-safe z-50 md:hidden">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl transition-all ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {isActive ? (
                <div className="bg-blue-100 rounded-full p-2 mb-1">
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <Icon className="w-6 h-6 mb-1" />
              )}
              <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;