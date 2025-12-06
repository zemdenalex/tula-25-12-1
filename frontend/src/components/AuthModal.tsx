import { useState } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { usersApi } from '../api';

type AuthMode = 'login' | 'register';

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, setUserId, fetchUserById } = useStore();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setName('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Заполните все обязательные поля');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Введите имя');
      return;
    }

    if (password.length < 4) {
      setError('Пароль должен быть не менее 4 символов');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let userId: number;
      
      if (mode === 'login') {
        const result = await usersApi.login({ email, password });
        userId = result.user_id;
      } else {
        const result = await usersApi.create({ name, email, password });
        userId = result.user_id;
      }
      
      setUserId(userId);
      await fetchUserById(userId);
      handleClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.response?.status === 400) {
        setError(mode === 'login' 
          ? 'Неверный email или пароль' 
          : 'Пользователь с таким email уже существует'
        );
      } else if (err.code === 'ERR_NETWORK') {
        setError('Ошибка сети. Проверьте подключение к интернету.');
      } else {
        setError('Произошла ошибка. Попробуйте позже.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleClose}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-3xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="w-8" />
            <h2 className="font-semibold text-lg">
              {mode === 'login' ? 'Вход' : 'Регистрация'}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Mode toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'login' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'register' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Регистрация
              </button>
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Имя
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ваше имя"
                      className="input-field pl-12"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.ru"
                    className="input-field pl-12"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-field pl-12"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={20} className="animate-spin" />}
              {isSubmitting 
                ? 'Загрузка...' 
                : mode === 'login' ? 'Войти' : 'Зарегистрироваться'
              }
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
