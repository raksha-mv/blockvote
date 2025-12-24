
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Poll, User } from './types';
import { INITIAL_POLLS } from './constants';
import Home from './pages/Home';
import Results from './pages/Results';
import LoginModal from './components/LoginModal';
import Chatbot from './components/Chatbot';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);

  useEffect(() => {
    const savedPolls = localStorage.getItem('blockvote_polls');
    if (savedPolls) {
      setPolls(JSON.parse(savedPolls));
    } else {
      setPolls(INITIAL_POLLS as Poll[]);
    }

    const savedUser = localStorage.getItem('blockvote_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem('blockvote_polls', JSON.stringify(polls));
    }
  }, [polls]);

  const handleLogin = (email: string) => {
    const newUser = { email, name: email.split('@')[0], isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('blockvote_user', JSON.stringify(newUser));
    setLoginModalOpen(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('blockvote_user');
  };

  const addPoll = (newPoll: Poll) => {
    setPolls(prev => [newPoll, ...prev]);
  };

  const closePoll = (id: string) => {
    setPolls(prev => prev.map(p => p.id === id ? { ...p, isActive: false } : p));
  };

  const castVote = (pollId: string, candidate: string) => {
    setPolls(prev => prev.map(p => {
      if (p.id === pollId) {
        const votes = { ...(p.votes || {}) };
        votes[candidate] = (votes[candidate] || 0) + 1;
        return { ...p, votes };
      }
      return p;
    }));
  };

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-50 w-full glass py-4 px-6 md:px-12 flex flex-col items-center border-b border-white/10">
          <Link to="/" className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary-pastel to-secondary-pastel bg-clip-text text-transparent mb-4 tracking-wider">
            BlockVote
          </Link>
          <nav className="flex items-center gap-4 w-full justify-between">
            <div className="flex gap-2">
              <NavLink to="/">Home</NavLink>
              <NavLink to="/results">Results</NavLink>
            </div>
            <div>
              {user ? (
                <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 border border-white/10">
                  <span className="hidden md:inline text-sm font-medium">{user.email}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-xs font-semibold text-accent-pastel hover:underline"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setLoginModalOpen(true)}
                  className="btn-gradient px-6 py-2 rounded-full font-semibold text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </nav>
        </header>

        <main className="flex-grow py-12 px-4 max-w-6xl mx-auto w-full">
          <Routes>
            <Route 
              path="/" 
              element={
                <Home 
                  user={user} 
                  polls={polls} 
                  onAddPoll={addPoll} 
                  onClosePoll={closePoll} 
                  onVote={castVote} 
                />
              } 
            />
            <Route path="/results" element={<Results polls={polls} />} />
          </Routes>
        </main>

        <footer className="glass border-t border-white/10 py-8 px-6 mt-auto">
          <div className="flex flex-col md:flex-row justify-around gap-8 text-center md:text-left">
            <div>
              <h4 className="font-bold text-lg mb-2">About</h4>
              <p className="text-sm text-gray-400 max-w-xs">Decentralized blockchain voting platform with transparency, security, and fairness.</p>
            </div>
            <div>
              <h4 className="font-bold text-lg mb-2">Quick Links</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li><Link to="/" className="hover:text-primary-pastel">Home</Link></li>
                <li><Link to="/results" className="hover:text-primary-pastel">Results</Link></li>
                <li><a href="#" className="hover:text-primary-pastel">Documentation</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            &copy; 2025 BlockVote - Blockchain Voting System. Built with Gemini AI.
          </div>
        </footer>

        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setLoginModalOpen(false)} 
          onLogin={handleLogin} 
        />
        
        <Chatbot />
      </div>
    </HashRouter>
  );
};

const NavLink: React.FC<{ to: string, children: React.ReactNode }> = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`px-6 py-2 rounded-xl font-semibold transition-all border ${
        isActive 
        ? 'bg-gradient-to-r from-primary-pastel/30 to-secondary-pastel/30 border-primary-pastel/50 text-white' 
        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </Link>
  );
}

export default App;
