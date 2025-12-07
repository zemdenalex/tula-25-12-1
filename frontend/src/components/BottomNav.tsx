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
      </div>
    </nav>
  );
};

export default BottomNav;