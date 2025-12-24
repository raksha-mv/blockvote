
import React, { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-dark-bg/90 backdrop-blur-sm animate-[fadeIn_0.3s_ease]">
      <div className="glass w-full max-w-md p-8 rounded-[32px] relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-gray-500 hover:text-white"
        >
          &times;
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
          <p className="text-gray-400 text-sm">Securely login to manage your polls</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary-pastel ml-2">EMAIL ADDRESS</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-secondary-pastel focus:bg-white/10 transition-all"
              placeholder="voter@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-primary-pastel ml-2">PASSWORD</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-secondary-pastel focus:bg-white/10 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" className="btn-gradient w-full py-4 rounded-2xl text-lg font-bold shadow-lg shadow-primary-pastel/10">
            Login Securely
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By logging in, you agree to our <a href="#" className="underline">Blockchain Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
