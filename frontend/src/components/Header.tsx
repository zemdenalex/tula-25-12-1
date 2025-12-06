import { Map, List, SlidersHorizontal, User, LogOut } from 'lucide-react';
import { useStore } from '../store';
import type { ViewMode } from '../types';

export default function Header() {
  const { viewMode, setViewMode, user, setAuthModalOpen, setFilterModalOpen, logout } = useStore();

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => toggleView('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'map'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map size={18} />
            <span className="hidden sm:inline">Карта</span>
          </button>
          <button
            onClick={() => toggleView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <List size={18} />
            <span className="hidden sm:inline">Список</span>
          </button>
        </div>

        <h1 className="text-lg font-semibold text-gray-900 hidden md:block">
          Карта Здоровья
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterModalOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <SlidersHorizontal size={20} />
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Выйти"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
            >
              <User size={18} />
              <span className="hidden sm:inline">Войти</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
