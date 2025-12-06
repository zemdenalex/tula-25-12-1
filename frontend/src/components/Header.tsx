import { Map, List, Plus, SlidersHorizontal } from 'lucide-react';
import { useStore } from '../store';

export default function Header() {
  const { viewMode, setViewMode, setFilterModalOpen, user, setAuthModalOpen } = useStore();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10 safe-area-top">
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setViewMode('map')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'map' 
              ? 'bg-primary-500 text-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label="Карта"
        >
          <Map size={20} />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded-lg transition-colors ${
            viewMode === 'list' 
              ? 'bg-primary-500 text-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          aria-label="Список"
        >
          <List size={20} />
        </button>
      </div>

      <h1 className="text-lg font-semibold text-gray-900">
        {viewMode === 'map' ? 'Карта' : 'Список'}
      </h1>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterModalOpen(true)}
          className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          aria-label="Фильтры"
        >
          <SlidersHorizontal size={20} />
        </button>
        
        {user ? (
          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true)}
            className="px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Войти
          </button>
        )}
      </div>
    </header>
  );
}
