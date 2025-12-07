import React, { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { 
  MapIcon, 
  TrophyIcon, 
  UsersIcon, 
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import AuthModal from './AuthModal';

interface HeaderProps {
  onAddPlace?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddPlace }) => {
  const { user, isAuthenticated, logout } = useStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleRegisterClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const navItems = [
    { to: '/', label: 'Объекты', icon: MapIcon },
    { to: '/leaderboard', label: 'Рейтинг', icon: TrophyIcon },
    { to: '/community', label: 'Сообщество', icon: UsersIcon },
    { to: '/profile', label: 'Профиль', icon: UserIcon },
  ];

  const isMapPage = location.pathname === '/' || location.pathname === '/map';

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">ЗОЖ Карта</span>
            </Link>

            {/* Desktop Navigation - hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-3">
              {/* Add Place Button (only on map page) */}
              {isMapPage && onAddPlace && (
                <button
                  onClick={onAddPlace}
                  className="hidden sm:flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="font-medium">Добавить место</span>
                </button>
              )}

              {/* Auth buttons */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link 
                    to="/profile" 
                    className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="font-medium">{user?.name || 'Пользователь'}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden sm:block text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Выйти
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center space-x-2">
                  <button
                    onClick={handleLoginClick}
                    className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2"
                  >
                    Вход
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Регистрация
                  </button>
                </div>
              )}

              {/* Mobile menu button - only for auth on mobile, nav is in bottom */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu overlay - only for auth actions */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              {isMapPage && onAddPlace && (
                <button
                  onClick={() => {
                    onAddPlace();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="font-medium">Добавить место</span>
                </button>
              )}
              
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3 py-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user?.name || 'Пользователь'}</p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center text-red-600 hover:text-red-700 font-medium py-2"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      handleLoginClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center text-gray-700 hover:text-gray-900 font-medium py-3 border border-gray-300 rounded-lg"
                  >
                    Вход
                  </button>
                  <button
                    onClick={() => {
                      handleRegisterClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
                  >
                    Регистрация
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;