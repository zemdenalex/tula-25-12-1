import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

const initialMessages: Message[] = [
  { 
    id: 1, 
    text: 'Привет! Я ваш помощник по здоровому образу жизни. Могу помочь найти полезные места в Туле, дать советы по питанию и активностям. Чем могу помочь?', 
    isBot: true 
  },
];

const botResponses: Record<string, string> = {
  'здоров': 'Здоровый образ жизни включает правильное питание, физическую активность и достаточный отдых. В Туле есть множество мест для занятий спортом - фитнес-центры, парки, бассейны. Хотите найти что-то конкретное?',
  'спорт': 'В Туле много спортивных объектов! Рекомендую обратить внимание на Центральный парк для пробежек, а также множество фитнес-центров. На нашей карте вы можете найти ближайшие к вам.',
  'питани': 'Правильное питание - основа здоровья! В Туле есть кафе и магазины со здоровым меню. Ищите места с зеленой отметкой "Здоровое" на нашей карте.',
  'парк': 'Парки Тулы отлично подходят для прогулок и занятий спортом. Центральный парк, Белоусовский парк - все они отмечены на карте.',
  'default': 'Интересный вопрос! К сожалению, я пока в разработке и не могу дать полный ответ. Но вы можете исследовать карту здоровья самостоятельно - там много полезной информации!',
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(botResponses)) {
      if (key !== 'default' && lowerMessage.includes(key)) {
        return response;
      }
    }
    return botResponses.default;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input.trim(),
      isBot: false,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: getBotResponse(input),
        isBot: true,
      };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <Bot className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Ассистент здоровья</h1>
            <p className="text-sm text-green-500">В сети</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.isBot ? '' : 'flex-row-reverse'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.isBot ? 'bg-primary-100' : 'bg-gray-200'
              }`}>
                {message.isBot ? (
                  <Bot className="text-primary-600" size={18} />
                ) : (
                  <User className="text-gray-600" size={18} />
                )}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl ${
                message.isBot 
                  ? 'bg-white border border-gray-200' 
                  : 'bg-primary-500 text-white'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4 safe-area-bottom">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="input-field flex-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-primary-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          Бета-версия. Полный функционал в разработке.
        </p>
      </div>
    </div>
  );
}
