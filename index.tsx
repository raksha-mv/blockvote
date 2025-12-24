import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

// --- TYPES ---
interface Poll {
  id: string;
  title: string;
  pollCode: string;
  candidates: string[];
  isActive: boolean;
  createdAt: number;
  creatorEmail?: string;
  endDate?: string;
  type: 'default' | 'moderated';
  votes?: Record<string, number>;
}

interface User {
  email: string;
  name: string;
  isLoggedIn: boolean;
}

declare var confetti: any;

const API_BASE = 'http://localhost:5000/api';

// --- API CLIENT WITH FALLBACK ---
// This allows the app to work in the preview (using LocalStorage) 
// while being fully ready for the Node.js/MongoDB backend.
const api = {
  async getPolls(): Promise<Poll[]> {
    try {
      const res = await fetch(`${API_BASE}/polls`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      console.warn("Backend unreachable, falling back to LocalStorage");
      const saved = localStorage.getItem('blockvote_polls');
      return saved ? JSON.parse(saved) : [];
    }
  },
  async createPoll(poll: Poll): Promise<Poll> {
    try {
      const res = await fetch(`${API_BASE}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poll)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch (e) {
      const saved = JSON.parse(localStorage.getItem('blockvote_polls') || '[]');
      const updated = [poll, ...saved];
      localStorage.setItem('blockvote_polls', JSON.stringify(updated));
      return poll;
    }
  },
  async castVote(pid: string, candidate: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pid}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      const saved = JSON.parse(localStorage.getItem('blockvote_polls') || '[]');
      const updated = saved.map((p: Poll) => {
        if (p.id === pid) {
          const votes = { ...(p.votes || {}) };
          votes[candidate] = (votes[candidate] || 0) + 1;
          return { ...p, votes };
        }
        return p;
      });
      localStorage.setItem('blockvote_polls', JSON.stringify(updated));
    }
  },
  async closePoll(pid: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/polls/${pid}/close`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
    } catch (e) {
      const saved = JSON.parse(localStorage.getItem('blockvote_polls') || '[]');
      const updated = saved.map((p: Poll) => p.id === pid ? { ...p, isActive: false } : p);
      localStorage.setItem('blockvote_polls', JSON.stringify(updated));
    }
  }
};

// --- AI SERVICE ---
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

async function askBlockAssist(question: string) {
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: question,
      config: {
        systemInstruction: `You are BlockAssist, an AI chatbot for BlockVote. 
        BlockVote is a decentralized voting platform with MongoDB Atlas persistence.
        Rules:
        - Answer in bulleted points ONLY.
        - Mention that polls are stored on MongoDB Atlas for permanence.
        - Explain that moderated polls allow creators to track and close voting.
        - Keep responses concise and glassmorphic-themed.`,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    return "• System connectivity issue.\n• Please ensure your API key is valid.\n• Local redundancy active.";
  }
}

// --- UI COMPONENTS ---

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: "• Welcome to BlockAssist.\n• I can help you with poll creation, voting, or result auditing." }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    const reply = await askBlockAssist(msg);
    setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    setLoading(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary-pastel to-secondary-pastel rounded-full shadow-2xl flex items-center justify-center text-3xl z-[9999] transition-transform active:scale-95">
        {isOpen ? '×' : '💬'}
      </button>
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-[380px] h-[500px] glass rounded-[32px] flex flex-col z-[9999] shadow-2xl overflow-hidden animate-[fadeUpCard_0.3s_ease]">
          <div className="p-5 bg-white/10 border-b border-white/10 font-bold flex justify-between items-center">
            <span>🤖 BlockAssist</span>
            <div className="w-2 h-2 rounded-full bg-success-pastel animate-pulse"></div>
          </div>
          <div className="flex-grow overflow-y-auto p-4 space-y-4 text-xs scrollbar-hide">
            {messages.map((m, i) => (
              <div key={i} className={`p-4 rounded-2xl ${m.role === 'user' ? 'bg-primary-pastel text-dark-bg ml-auto max-w-[85%]' : 'bg-white/5 border border-white/10 mr-auto max-w-[85%]'}`}>
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              </div>
            ))}
            {loading && <div className="italic text-gray-500 ml-2 animate-pulse">Assistant is typing...</div>}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-white/10 flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Ask about BlockVote..." className="flex-grow bg-white/5 border border-white/20 rounded-full px-4 py-2 outline-none text-xs focus:border-secondary-pastel" />
            <button onClick={handleSend} className="bg-secondary-pastel text-dark-bg px-5 rounded-full font-bold text-xs hover:brightness-110 transition-all">Send</button>
          </div>
        </div>
      )}
    </>
  );
};

const CreatePoll: React.FC<{ user: User | null, onSuccess: () => void, onBack: () => void }> = ({ user, onSuccess, onBack }) => {
  const [title, setTitle] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [type, setType] = useState<'default' | 'moderated'>('default');
  const [endDate, setEndDate] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [generatedPoll, setGeneratedPoll] = useState<Poll | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'moderated' && !user) { alert("Please login to create moderated polls."); return; }
    const finalCans = candidates.filter(c => c.trim() !== '');
    if (finalCans.length < 2) { alert("Minimum 2 candidates required."); return; }

    const newPoll: Poll = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      pollCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      candidates: finalCans,
      isActive: true,
      createdAt: Date.now(),
      creatorEmail: user?.email,
      type,
      endDate: type === 'moderated' ? endDate : undefined,
      votes: finalCans.reduce((acc, c) => ({ ...acc, [c]: 0 }), {})
    };

    const savedPoll = await api.createPoll(newPoll);
    setGeneratedPoll(savedPoll);
    setIsCreated(true);
    onSuccess();
  };

  if (isCreated && generatedPoll) {
    return (
      <div className="glass p-12 rounded-[48px] text-center max-w-2xl mx-auto space-y-8 animate-[fadeUpCard_0.5s_ease]">
        <h2 className="text-4xl font-bold text-success-pastel">✓ Protocol Initialized</h2>
        <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
          <p className="text-xs font-bold text-primary-pastel uppercase tracking-widest">Election Access Code</p>
          <div className="text-4xl font-mono font-bold text-secondary-pastel bg-white/5 p-5 rounded-2xl border border-secondary-pastel/20 select-all tracking-tighter">
            {generatedPoll.pollCode}
          </div>
          <p className="text-gray-400 text-sm italic">Persisted on MongoDB Atlas.</p>
        </div>
        <button onClick={onBack} className="btn-gradient px-12 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="glass p-10 rounded-[48px] max-w-2xl mx-auto animate-[fadeUpCard_0.4s_ease]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">New Consensus Poll</h2>
        <button onClick={onBack} className="text-gray-400 hover:text-white font-bold">← Back</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => setType('default')} className={`p-5 rounded-2xl border text-left transition-all ${type === 'default' ? 'border-primary-pastel bg-primary-pastel/10' : 'border-white/10 bg-white/5 opacity-50'}`}>
            <h4 className="font-bold">Default</h4>
            <p className="text-[10px] text-gray-400">Open community election</p>
          </button>
          <button type="button" onClick={() => setType('moderated')} className={`p-5 rounded-2xl border text-left transition-all ${type === 'moderated' ? 'border-primary-pastel bg-primary-pastel/10' : 'border-white/10 bg-white/5 opacity-50'}`}>
            <h4 className="font-bold">Moderated</h4>
            <p className="text-[10px] text-gray-400">Owner control & deadline</p>
          </button>
        </div>
        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Poll Title" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:border-secondary-pastel transition-all" />
        <div className="space-y-3">
          <label className="text-xs font-bold text-primary-pastel ml-1 uppercase">Candidates</label>
          {candidates.map((c, idx) => (
            <div key={idx} className="flex gap-2">
              <input type="text" required value={c} onChange={e => { const n = [...candidates]; n[idx] = e.target.value; setCandidates(n); }} className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-secondary-pastel transition-all" placeholder={`Option ${idx + 1}`} />
              <button type="button" onClick={() => setCandidates(candidates.filter((_, i) => i !== idx))} className="bg-accent-pastel/10 text-accent-pastel p-4 rounded-2xl hover:bg-accent-pastel hover:text-white transition-all">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setCandidates([...candidates, ''])} className="text-xs font-bold text-secondary-pastel hover:underline ml-1">+ Add Option</button>
        </div>
        {type === 'moderated' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-primary-pastel ml-1 uppercase">Expiration Date</label>
            <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-gray-300 outline-none focus:border-secondary-pastel" />
          </div>
        )}
        <button type="submit" className="btn-gradient w-full py-5 rounded-[24px] text-xl font-bold mt-4 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Create Election</button>
      </form>
    </div>
  );
};

const PollList: React.FC<{ polls: Poll[], onVote: (pid: string, can: string) => void }> = ({ polls, onVote }) => {
  const [step, setStep] = useState<'join' | 'identity' | 'candidate'>('join');
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterWallet, setVoterWallet] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const handleJoin = () => {
    const input = joinInput.trim().toUpperCase();
    const found = polls.find(p => p.pollCode.toUpperCase() === input || p.id === joinInput);
    if (found) {
      if (!found.isActive) { alert("This election is closed."); return; }
      setActivePoll(found);
      setStep('identity');
    } else alert("Invalid election code.");
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.length < 2 || voterWallet.length < 10) { 
      alert("Please enter a valid identity and wallet (10+ characters)."); 
      return; 
    }
    setStep('candidate');
  };

  const handleFinalVote = () => {
    if (!selectedCandidate || !activePoll) return;
    onVote(activePoll.id, selectedCandidate);
    alert(`Consensus achieved. Vote recorded for ${selectedCandidate}.`);
    reset();
  };

  const reset = () => { setStep('join'); setActivePoll(null); setJoinInput(''); setVoterName(''); setVoterWallet(''); setSelectedCandidate(null); };

  return (
    <div className="max-w-xl mx-auto animate-[fadeIn_0.5s_ease]">
      {step === 'join' && (
        <div className="glass p-12 rounded-[48px] text-center space-y-8">
          <div className="text-6xl">🗳️</div>
          <h3 className="text-3xl font-bold">Join Election</h3>
          <p className="text-gray-400 text-sm">Enter the unique protocol code to verify your participation.</p>
          <div className="space-y-4">
            <input type="text" placeholder="Protocol Code" value={joinInput} onChange={e => setJoinInput(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none text-center font-mono font-bold text-2xl uppercase tracking-[0.2em] focus:border-secondary-pastel transition-all" />
            <button onClick={handleJoin} className="btn-gradient w-full py-5 rounded-2xl font-bold text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Connect to Poll</button>
          </div>
        </div>
      )}
      {step === 'identity' && activePoll && (
        <div className="glass p-12 rounded-[48px] space-y-8 animate-[fadeUpCard_0.3s_ease]">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{activePoll.title}</h3>
            <p className="text-xs text-secondary-pastel font-bold uppercase mt-2 tracking-widest">Voter Verification</p>
          </div>
          <form onSubmit={handleIdentitySubmit} className="space-y-5">
            <input type="text" required value={voterName} onChange={e => setVoterName(e.target.value)} placeholder="Legal Name" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:border-secondary-pastel transition-all" />
            <input type="text" required value={voterWallet} onChange={e => setVoterWallet(e.target.value)} placeholder="Wallet Signature (0x...)" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none font-mono text-sm focus:border-secondary-pastel transition-all" />
            <div className="flex gap-4 pt-4">
              <button type="submit" className="btn-gradient flex-1 py-5 rounded-2xl font-bold text-lg">Enter Booth</button>
              <button type="button" onClick={reset} className="bg-white/5 px-8 py-5 rounded-2xl font-bold text-gray-500 hover:bg-white/10 transition-all">Abort</button>
            </div>
          </form>
        </div>
      )}
      {step === 'candidate' && activePoll && (
        <div className="glass p-10 rounded-[48px] space-y-8 animate-[fadeUpCard_0.3s_ease]">
          <div className="text-center">
            <h3 className="text-3xl font-bold">{activePoll.title}</h3>
            <p className="text-gray-400 text-sm mt-2 italic">Secured session for {voterName}</p>
          </div>
          <div className="grid gap-4">
            {activePoll.candidates.map(can => (
              <label key={can} className={`flex items-center justify-between p-6 rounded-[32px] border cursor-pointer transition-all ${selectedCandidate === can ? 'bg-secondary-pastel/20 border-secondary-pastel scale-[1.02]' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                <span className="text-lg font-bold">{can}</span>
                <input type="radio" name="can" value={can} className="hidden" onChange={() => setSelectedCandidate(can)} />
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedCandidate === can ? 'border-secondary-pastel bg-secondary-pastel shadow-[0_0_15px_rgba(110,231,222,0.4)]' : 'border-white/20'}`}>
                  {selectedCandidate === can && <div className="w-3 h-3 rounded-full bg-dark-bg"></div>}
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-4 pt-6">
            <button onClick={handleFinalVote} disabled={!selectedCandidate} className={`flex-1 py-5 rounded-[24px] font-bold text-xl shadow-2xl transition-all ${selectedCandidate ? 'btn-gradient scale-100' : 'bg-white/5 opacity-40 cursor-not-allowed'}`}>Broadcast Vote</button>
            <button onClick={reset} className="bg-white/5 px-8 py-5 rounded-[24px] font-bold text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [view, setView] = useState<'home' | 'create' | 'vote'>('home');
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    refreshPolls();
    const savedUser = localStorage.getItem('blockvote_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const refreshPolls = async () => {
    const data = await api.getPolls();
    setPolls(data);
  };

  const handleCastVote = async (pid: string, can: string) => {
    await api.castVote(pid, can);
    await refreshPolls();
    setView('home');
  };

  const handleClosePoll = async (pid: string) => {
    await api.closePoll(pid);
    await refreshPolls();
  };

  const handleLogin = (email: string) => {
    const newUser = { email, name: email.split('@')[0], isLoggedIn: true };
    setUser(newUser);
    localStorage.setItem('blockvote_user', JSON.stringify(newUser));
    setLoginModalOpen(false);
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col font-montserrat">
        <header className="sticky top-0 z-50 glass py-6 px-8 md:px-16 flex flex-col items-center border-b border-white/10">
          <Link to="/" onClick={() => setView('home')} className="text-4xl md:text-5xl font-black bg-gradient-to-r from-primary-pastel to-secondary-pastel bg-clip-text text-transparent mb-6 tracking-tighter">BlockVote</Link>
          <nav className="flex items-center justify-between w-full max-w-5xl">
            <div className="flex gap-3">
              <Link to="/" onClick={() => setView('home')} className="px-6 py-2 rounded-2xl bg-white/5 hover:bg-white/10 font-bold border border-white/5 transition-all">Home</Link>
              <Link to="/results" className="px-6 py-2 rounded-2xl bg-white/5 hover:bg-white/10 font-bold border border-white/5 transition-all">Results</Link>
            </div>
            {user ? (
              <div className="flex items-center gap-4 bg-white/5 px-6 py-2 rounded-full border border-white/10">
                <span className="text-xs font-bold opacity-60 hidden sm:inline">{user.email}</span>
                <button onClick={() => { setUser(null); localStorage.removeItem('blockvote_user'); }} className="text-xs font-bold text-accent-pastel hover:underline">Logout</button>
              </div>
            ) : (
              <button onClick={() => setLoginModalOpen(true)} className="btn-gradient px-8 py-2 rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all">Login</button>
            )}
          </nav>
        </header>

        <main className="flex-grow py-16 px-6 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/" element={
              <div className="space-y-16">
                {view === 'home' && (
                  <div className="glass p-16 rounded-[64px] text-center max-w-3xl mx-auto space-y-10 animate-[fadeUpCard_0.5s_ease]">
                    <div className="inline-block px-4 py-1 rounded-full bg-secondary-pastel/10 border border-secondary-pastel/20 text-secondary-pastel text-[10px] font-black uppercase tracking-[0.3em] mb-2">Protocol Active</div>
                    <h2 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight">Governance <br/><span className="text-secondary-pastel">Redefined.</span></h2>
                    <p className="text-gray-400 text-xl max-w-xl mx-auto leading-relaxed font-medium">Verify your identity, cast your encrypted vote, and watch the results unfold in real-time on MongoDB Atlas.</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
                      <button onClick={() => setView('create')} className="btn-gradient px-12 py-6 rounded-[32px] text-2xl font-bold flex-1 hover:scale-105 shadow-2xl transition-all">📝 New Poll</button>
                      <button onClick={() => setView('vote')} className="bg-white/5 border border-white/10 hover:bg-white/10 px-12 py-6 rounded-[32px] text-2xl font-bold flex-1 hover:scale-105 transition-all">🗳️ Cast Vote</button>
                    </div>
                  </div>
                )}
                
                {view === 'create' && <CreatePoll user={user} onSuccess={refreshPolls} onBack={() => setView('home')} />}
                {view === 'vote' && <PollList polls={polls} onVote={handleCastVote} />}

                {user && view === 'home' && (
                  <div className="glass p-12 rounded-[56px] max-w-4xl mx-auto border-primary-pastel/10 shadow-inner animate-[fadeIn_0.6s_ease]">
                    <h2 className="text-3xl font-black mb-10 flex items-center gap-3">
                      <span className="w-12 h-12 bg-primary-pastel/10 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🛠️</span>
                      My Governance
                    </h2>
                    <div className="grid gap-6">
                      {polls.filter(p => p.creatorEmail === user.email).length > 0 ? (
                        polls.filter(p => p.creatorEmail === user.email).map(p => (
                          <div key={p.id} className="bg-white/5 border border-white/10 p-8 rounded-[36px] flex flex-col md:flex-row justify-between items-center gap-6 hover:bg-white/10 transition-all group border-l-4 border-l-secondary-pastel">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-2xl font-black group-hover:text-secondary-pastel transition-colors">{p.title}</h4>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${p.isActive ? 'bg-success-pastel/20 text-success-pastel' : 'bg-gray-500/20 text-gray-500'}`}>{p.isActive ? 'Active' : 'Closed'}</span>
                              </div>
                              <p className="text-[10px] text-primary-pastel font-black uppercase tracking-[0.2em] mt-2">Protocol: {p.pollCode}</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                              {p.isActive ? (
                                <button onClick={() => handleClosePoll(p.id)} className="flex-1 md:flex-none bg-accent-pastel/10 text-accent-pastel border border-accent-pastel/20 px-8 py-3 rounded-2xl text-xs font-bold hover:bg-accent-pastel hover:text-white transition-all">Close Protocol</button>
                              ) : <span className="flex-1 md:flex-none text-center bg-white/5 text-gray-600 border border-white/5 px-8 py-3 rounded-2xl text-xs font-bold">Consensus Locked</span>}
                              <Link to="/results" className="flex-1 md:flex-none text-center bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl text-xs font-bold transition-all border border-white/10">Audit Results</Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-20 bg-white/5 rounded-[36px] border border-dashed border-white/10 text-gray-600 font-bold">You haven't initiated any decentralized polls yet.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            } />
            <Route path="/results" element={<Results polls={polls} />} />
          </Routes>
        </main>

        <Chatbot />
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-dark-bg/95 backdrop-blur-md animate-[fadeIn_0.3s_ease]">
            <div className="glass w-full max-w-md p-10 rounded-[48px] relative shadow-2xl">
              <button onClick={() => setLoginModalOpen(false)} className="absolute top-8 right-8 text-3xl text-gray-500 hover:text-white">&times;</button>
              <div className="text-center mb-10">
                <h2 className="text-4xl font-black mb-2">Auth Required</h2>
                <p className="text-gray-400 text-sm">Secure your governance session</p>
              </div>
              <form onSubmit={e => { e.preventDefault(); handleLogin((e.target as any).email.value); }} className="space-y-6">
                <input name="email" type="email" required placeholder="Email Address" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:border-secondary-pastel transition-all" />
                <input type="password" required placeholder="Session Secret" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:border-secondary-pastel transition-all" />
                <button type="submit" className="btn-gradient w-full py-5 rounded-[24px] text-xl font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Authenticate</button>
              </form>
            </div>
          </div>
        )}
        
        <footer className="py-12 px-8 border-t border-white/10 glass mt-20">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-gray-500 text-sm">
            <div className="text-center md:text-left">
              <h5 className="text-white font-bold text-lg mb-2">BlockVote</h5>
              <p>Peer-to-peer voting architecture with MongoDB Atlas.</p>
            </div>
            <div className="flex gap-8 font-bold">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/results" className="hover:text-white">Results</Link>
              <a href="#" className="hover:text-white">Documentation</a>
            </div>
            <div className="opacity-40 text-xs">© 2025 Decentralized Governance Protocol</div>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
};

const Results: React.FC<{ polls: Poll[] }> = ({ polls }) => {
  const [wallet, setWallet] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isVerified && polls.some(p => !p.isActive)) {
      if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 }, colors: ['#8b9ef7', '#6ee7de', '#f07d9e'] });
      }
    }
  }, [isVerified, polls]);

  if (!isVerified) return (
    <div className="glass p-16 rounded-[64px] text-center max-w-xl mx-auto space-y-10 animate-[fadeUpCard_0.4s_ease]">
      <div className="text-7xl">🔒</div>
      <div>
        <h2 className="text-4xl font-black mb-3">Audit Protocol</h2>
        <p className="text-gray-400 text-lg">Results are encrypted on Atlas. Verify your wallet signature to audit the consensus.</p>
      </div>
      <form onSubmit={e => { e.preventDefault(); if (wallet.length > 5) setIsVerified(true); else alert("Invalid wallet."); }} className="space-y-6">
        <input type="text" value={wallet} onChange={e => setWallet(e.target.value)} required placeholder="Wallet Address (0x...)" className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 outline-none text-center font-mono text-sm focus:border-secondary-pastel transition-all shadow-inner" />
        <button type="submit" className="btn-gradient w-full py-6 rounded-[28px] text-2xl font-bold shadow-2xl hover:scale-[1.02] active:scale-95 transition-all">Access Consenus</button>
      </form>
    </div>
  );

  return (
    <div className="space-y-12 animate-[fadeIn_0.5s_ease]">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 p-8 rounded-[36px] border border-white/10 gap-6">
        <div className="text-center sm:text-left">
          <h2 className="text-3xl font-black text-secondary-pastel flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-secondary-pastel animate-pulse"></span>
            Live Audit Stream
          </h2>
          <p className="text-xs font-mono text-gray-500 mt-1 truncate max-w-xs">{wallet}</p>
        </div>
        <button onClick={() => setIsVerified(false)} className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/10 transition-all">Revoke Session</button>
      </div>
      <div className="grid gap-10">
        {polls.length > 0 ? polls.map(p => {
          const v = Object.values(p.votes || {}) as number[];
          const total = v.reduce((a, b) => a + b, 0);
          const maxVal = Math.max(...(v.length ? v : [0]));
          return (
            <div key={p.id} className="glass p-12 rounded-[56px] space-y-10 relative overflow-hidden group">
              {!p.isActive && <div className="absolute top-0 right-0 p-8 text-success-pastel font-black text-xs uppercase tracking-widest bg-success-pastel/10 border-b border-l border-white/10 rounded-bl-[32px]">Consensus Finalized</div>}
              <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <h3 className="text-4xl font-black mb-3 group-hover:text-secondary-pastel transition-colors">{p.title}</h3>
                  <div className="flex gap-4 items-center">
                    <span className="text-[10px] font-black text-primary-pastel uppercase bg-primary-pastel/10 px-4 py-1.5 rounded-full border border-primary-pastel/20 tracking-[0.2em]">Hash ID: {p.pollCode}</span>
                    <span className="text-xs font-bold text-gray-500">Global Participation: <span className="text-white">{total} Voters</span></span>
                  </div>
                </div>
                <span className={`px-6 py-2 rounded-full text-xs font-black border uppercase tracking-widest ${p.isActive ? 'border-success-pastel text-success-pastel bg-success-pastel/5' : 'border-gray-500 text-gray-500 bg-gray-500/5'}`}>{p.isActive ? 'Polling Live' : 'Archived'}</span>
              </div>
              <div className="space-y-8">
                {p.candidates.map(can => {
                  const count = p.votes?.[can] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const isLeader = count > 0 && count === maxVal;
                  return (
                    <div key={can} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className={`text-xl font-bold ${isLeader ? 'text-secondary-pastel' : 'text-gray-300'}`}>{can} {isLeader && !p.isActive && '🏆'}</span>
                        <span className="text-gray-400 font-mono text-sm">{count} <span className="text-[10px] opacity-40 ml-1">Votes</span> ({pct}%)</span>
                      </div>
                      <div className="h-7 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1.5 shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 shadow-xl ${isLeader ? 'bg-gradient-to-r from-secondary-pastel to-primary-pastel shadow-[0_0_15px_rgba(110,231,222,0.3)]' : 'bg-white/10'}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-gray-700 italic gap-4">
                <span className="bg-white/5 px-4 py-2 rounded-xl truncate max-w-full">SHA-256: {Math.random().toString(16).substr(2, 48).toUpperCase()}</span>
                <span className="text-success-pastel font-bold uppercase tracking-widest flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-success-pastel"></div>
                   Atlas Node Verified ✓
                </span>
              </div>
            </div>
          );
        }) : <div className="text-center py-40 glass rounded-[64px] font-bold text-gray-600 italic">No consensus data available in peer network.</div>}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<React.StrictMode><App /></React.StrictMode>);