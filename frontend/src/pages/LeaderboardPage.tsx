import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, User } from '../store';
import { TrophyIcon } from '@heroicons/react/24/solid';

type Period = 'week' | 'month' | 'all';

const LeaderboardPage: React.FC = () => {
  const { users, fetchUsers, isLoadingUsers } = useStore();
  const [period, setPeriod] = useState<Period>('week');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Sort users by rating
  const sortedUsers = [...users].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const periods: { value: Period; label: string }[] = [
    { value: 'week', label: 'Эта неделя' },
    { value: 'month', label: 'Этот месяц' },
    { value: 'all', label: 'За все время' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Рейтинг</h1>

      {/* Period tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        {periods.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              period === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      {isLoadingUsers ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Загрузка...</p>
        </div>
      ) : sortedUsers.length === 0 ? (
        <div className="text-center py-12">
          <TrophyIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Пока нет участников</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedUsers.map((user, index) => (
            <LeaderboardItem key={user.user_id} user={user} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

interface LeaderboardItemProps {
  user: User;
  rank: number;
}

const LeaderboardItem: React.FC<LeaderboardItemProps> = ({ user, rank }) => {
  const isWinner = rank === 1;

  return (
    <Link
      to={`/user/${user.user_id}`}
      className="flex items-center p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
    >
      {/* Rank */}
      <span className="text-lg font-medium text-gray-500 w-8">
        {rank}
      </span>

      {/* Avatar */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
        isWinner ? 'bg-blue-600' : 'bg-blue-500'
      }`}>
        <span className="text-white font-bold text-lg">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>

      {/* User info */}
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{user.name || 'Пользователь'}</h3>
        {isWinner && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
            Победитель
          </span>
        )}
      </div>

      {/* Points */}
      <div className="px-3 py-1 bg-gray-100 rounded-lg">
        <span className="font-medium text-gray-900">{user.rating || 0} птср</span>
      </div>
    </Link>
  );
};

export default LeaderboardPage;