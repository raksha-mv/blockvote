
import React, { useState, useRef, useEffect } from 'react';
import { askBlockAssist } from '../services/geminiService';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "Hello! I'm your BlockAssist assistant. I can help you understand how to use this blockchain voting platform.\n\nAsk me about:\n- Creating moderated polls\n- Voting security\n- Viewing results\n- Email registration" }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const botResponse = await askBlockAssist(userMsg);
    setMessages(prev => [...prev, { role: 'bot', text: botResponse || "I didn't quite catch that." }]);
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary-pastel to-secondary-pastel rounded-full shadow-2xl flex items-center justify-center text-3xl z-[9999] transition-transform active:scale-90"
      >
        {isOpen ? '×' : '💬'}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-[380px] h-[550px] glass rounded-3xl flex flex-col z-[9999] shadow-2xl animate-[slideIn_0.3s_ease]">
          <div className="p-6 bg-gradient-to-r from-primary-pastel/20 to-secondary-pastel/20 border-b border-white/10 rounded-t-3xl flex justify-between items-center">
            <h3 className="font-bold text-xl">🤖 BlockAssist</h3>
            <div className="w-2 h-2 rounded-full bg-success-pastel animate-pulse"></div>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 text-sm scrollbar-hide">
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-primary-pastel text-dark-bg ml-auto' : 'bg-white/5 border border-white/10 mr-auto text-gray-200'}`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mr-auto max-w-[85%] animate-pulse italic text-gray-400">
                BlockAssist is thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/10 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything about BlockVote..."
              className="flex-grow bg-white/5 border border-white/20 rounded-full px-4 py-2 outline-none focus:border-secondary-pastel text-sm"
            />
            <button 
              onClick={handleSend}
              className="bg-secondary-pastel text-dark-bg p-2 px-4 rounded-full font-bold hover:brightness-110"
            >
              Send
            </button>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUpCard { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
};

export default Chatbot;
