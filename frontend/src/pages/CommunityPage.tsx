import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { FiMessageCircle, FiBell, FiThumbsUp, FiThumbsDown, FiStar, FiX, FiSend, FiChevronLeft, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { api } from '../api';

interface Review {
  id: number;
  id_user: number;
  user_name: string;
  id_place: number;
  text: string;
  review_photos: string[];
  like: number;
  dislike: number;
  rating: number;
}

interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
}

const CommunityPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, text: 'Привет! Я твой помощник', isBot: true, timestamp: new Date() },
    { id: 2, text: 'Чем я могу помочь?', isBot: true, timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [notifications] = useState<Notification[]>([
    { id: 1, title: 'Добавление объекта', message: 'Пожалуйста, перепишете отзыв, адрес не совпадает с действительным расположением', type: 'warning', read: false },
    { id: 2, title: 'Публикация отзыва', message: 'Ваш отзыв был опубликован', type: 'success', read: false },
    { id: 3, title: 'Публикация отзыва', message: 'Ваш отзыв был опубликован', type: 'success', read: true },
  ]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const response = await api.get(`/user/follow/${userId}?limit=20`);
        setReviews(response.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([
        { id: 1, id_user: 2, user_name: 'Ванечка Иванов', id_place: 1, text: 'Классное место с кучей тренажеров, короче круто', review_photos: [], like: 5, dislike: 1, rating: 4 },
        { id: 2, id_user: 3, user_name: 'Мария Петрова', id_place: 2, text: 'Отличный парк для пробежек!', review_photos: [], like: 12, dislike: 0, rating: 5 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: chatInput,
      isBot: false,
      timestamp: new Date(),
    };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');
    setIsSending(true);

    try {
      const response = await api.post('/gpt/chat', { text: chatInput });
      const botMessage: ChatMessage = {
        id: Date.now() + 1,
        text: response.data.answer,
        isBot: true,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        text: 'Извините, произошла ошибка. Попробуйте позже.',
        isBot: true,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  if (showNotifications) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10">
          <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Уведомления</h1>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiCheck className="w-5 h-5" />
          </button>
        </header>

        <div className="p-4 space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className={`bg-white rounded-2xl p-4 ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${notification.type === 'warning' ? 'bg-red-100 text-red-600' : notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  {notification.type === 'warning' ? <FiAlertCircle className="w-5 h-5" /> : <FiInfo className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${notification.type === 'warning' ? 'text-red-600' : ''}`}>{notification.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <BottomNav />
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white px-4 py-3 flex items-center gap-3 border-b sticky top-0 z-10">
          <button onClick={() => setShowChat(false)} className="p-2 hover:bg-gray-100 rounded-full">
            <FiChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">Пряник-бот</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {chatMessages.map((message) => (
            <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] ${message.isBot ? 'order-2' : ''}`}>
                {message.isBot && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm">🍪</span>
                    </div>
                    <span className="text-sm font-medium">Пряник</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Бот</span>
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2 ${message.isBot ? 'bg-white border' : 'bg-blue-600 text-white'}`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-400' : 'text-blue-200'}`}>
                    {formatTime(message.timestamp)} {!message.isBot && '✓✓'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Или предложи"
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending || !chatInput.trim()}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-3 flex items-center justify-between border-b sticky top-0 z-10">
        <button onClick={() => setShowChat(true)} className="p-2 hover:bg-gray-100 rounded-full">
          <FiMessageCircle className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold">Сообщество</h1>
        <button onClick={() => setShowNotifications(true)} className="p-2 hover:bg-gray-100 rounded-full relative">
          <FiBell className="w-6 h-6" />
          {notifications.some(n => !n.read) && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </header>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Нет отзывов от подписок</p>
            <p className="text-sm mt-2">Подпишитесь на пользователей, чтобы видеть их отзывы</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => navigate(`/user/${review.id_user}`)} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-medium">{review.user_name?.charAt(0) || '?'}</span>
                  </div>
                  <span className="font-medium">{review.user_name}</span>
                </button>
                <span className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg">
                  {1703} птср
                </span>
              </div>

              {review.review_photos?.length > 0 && (
                <div className="bg-gray-100 rounded-xl h-48 mb-3 flex items-center justify-center">
                  <img src={review.review_photos[0]} alt="" className="w-full h-full object-cover rounded-xl" />
                </div>
              )}
              {!review.review_photos?.length && (
                <div className="bg-gray-100 rounded-xl h-48 mb-3 flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <p className="text-xs text-gray-400 mb-1">24.09.25</p>
              <p className="font-medium mb-1">Фитнес-клуб "Атлант"</p>
              {renderStars(review.rating)}
              <p className="text-gray-700 mt-2 text-sm">{review.text}</p>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600">
                    <FiThumbsUp className="w-5 h-5" />
                    <span className="text-sm">{review.like}</span>
                  </button>
                  <button className="flex items-center gap-1 text-gray-500 hover:text-red-600">
                    <FiThumbsDown className="w-5 h-5" />
                    <span className="text-sm">{review.dislike}</span>
                  </button>
                </div>
                <button
                  onClick={() => navigate(`/place/${review.id_place}`)}
                  className="text-sm text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50"
                >
                  К объекту
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default CommunityPage;