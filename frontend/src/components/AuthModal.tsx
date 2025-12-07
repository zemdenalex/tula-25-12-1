import { useState } from 'react';
import { FiX, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { api } from '../api';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (userId: number) => void;
}

const AuthModal = ({ onClose, onSuccess }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const response = await api.post('/user/login', { email, password });
        if (response.data.user_id) {
          onSuccess(response.data.user_id);
        } else {
          setError('Неверный email или пароль');
        }
      } else {
        const response = await api.post('/user/create', { name, email, password });
        if (response.data.user_id) {
          onSuccess(response.data.user_id);
        } else {
          setError('Ошибка при регистрации');
        }
      }
    } catch (err) {
      setError('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{isLogin ? 'Вход' : 'Регистрация'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {!isLogin && (
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
          </button>

          <p className="text-center text-sm text-gray-500">
            {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-medium">
              {isLogin ? 'Регистрация' : 'Войти'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;