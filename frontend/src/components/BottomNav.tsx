<<<<<<< HEAD
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMap, FiAward, FiUsers, FiUser } from 'react-icons/fi';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'objects', label: 'Объекты', icon: FiMap, path: '/' },
    { id: 'rating', label: 'Рейтинг', icon: FiAward, path: '/leaderboard' },
    { id: 'community', label: 'Сообщество', icon: FiUsers, path: '/community' },
    { id: 'profile', label: 'Профиль', icon: FiUser, path: '/profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all min-w-[60px] ${
                active
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className={`text-[10px] mt-1 ${active ? 'font-medium' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
=======
import React from 'react';
import { NavLink } from 'react-router-dom';
import { MapIcon, TrophyIcon, UsersIcon, UserIcon } from '@heroicons/react/24/outline';
import { MapIcon as MapIconSolid, TrophyIcon as TrophyIconSolid, UsersIcon as UsersIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

const navItems = [
  { to: '/', label: 'Объекты', icon: MapIcon, activeIcon: MapIconSolid },
  { to: '/leaderboard', label: 'Рейтинг', icon: TrophyIcon, activeIcon: TrophyIconSolid },
  { to: '/community', label: 'Сообщество', icon: UsersIcon, activeIcon: UsersIconSolid },
  { to: '/profile', label: 'Профиль', icon: UserIcon, activeIcon: UserIconSolid },
];

const BottomNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ to, label, icon: Icon, activeIcon: ActiveIcon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <ActiveIcon className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
                <span className="text-xs mt-1 font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
>>>>>>> aa80096d1e1cd0a3c22ab9abec960d40bad68eaa
      </div>
    </nav>
  );
};

export default BottomNav;