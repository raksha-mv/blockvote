
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Poll } from '../types';
import CreatePoll from '../components/CreatePoll';
import PollList from '../components/PollList';

interface HomeProps {
  user: User | null;
  polls: Poll[];
  onAddPoll: (poll: Poll) => void;
  onClosePoll: (id: string) => void;
  onVote: (pollId: string, candidate: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, polls, onAddPoll, onClosePoll, onVote }) => {
  const [view, setView] = useState<'options' | 'create' | 'vote'>('options');

  const myPolls = polls.filter(p => p.creatorEmail === user?.email);

  const handleVoteAction = (pollId: string, candidate: string) => {
    onVote(pollId, candidate);
    setView('options');
  };

  return (
    <div className="space-y-12 pb-20">
      {view === 'options' && (
        <div className="glass p-12 rounded-[48px] text-center max-w-2xl mx-auto space-y-8 animate-[fadeUpCard_0.5s_ease]">
          <div className="inline-block px-4 py-1 rounded-full bg-secondary-pastel/10 border border-secondary-pastel/20 text-secondary-pastel text-[10px] font-bold uppercase tracking-widest mb-2">
            Blockchain Protocol v2.5
          </div>
          <h2 className="text-4xl md:text-5xl font-bold leading-tight">Secure, Transparent, <br/><span className="text-secondary-pastel">Decentralized.</span></h2>
          <p className="text-gray-400 text-lg">Cast your vote on the blockchain. Every entry is encrypted and verifiable.</p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center mt-12">
            <button 
              onClick={() => setView('create')}
              className="btn-gradient px-10 py-5 rounded-[24px] text-xl font-bold flex-1 shadow-2xl shadow-primary-pastel/20 hover:scale-105 transition-transform"
            >
              📝 Create Poll
            </button>
            <button 
              onClick={() => setView('vote')}
              className="bg-white/5 border border-white/10 hover:bg-white/10 px-10 py-5 rounded-[24px] text-xl font-bold flex-1 transition-all"
            >
              🗳️ Vote in Poll
            </button>
          </div>
        </div>
      )}

      {view === 'create' && (
        <CreatePoll 
          user={user} 
          onSuccess={onAddPoll} 
          onBack={() => setView('options')} 
        />
      )}

      {view === 'vote' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center max-w-xl mx-auto">
            <button onClick={() => setView('options')} className="text-gray-400 hover:text-white flex items-center gap-2 font-bold text-sm">
              <span>←</span> Exit Voting
            </button>
          </div>
          <PollList polls={polls} onVote={handleVoteAction} />
        </div>
      )}

      {user && view === 'options' && (
        <div className="glass p-10 rounded-[40px] max-w-4xl mx-auto animate-[fadeIn_0.6s_ease]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold">Your Moderated Polls</h2>
              <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Administrator Dashboard</p>
            </div>
            <div className="hidden md:block h-1 w-20 bg-gradient-to-r from-primary-pastel to-secondary-pastel rounded-full"></div>
          </div>
          
          {myPolls.length > 0 ? (
            <div className="grid gap-6">
              {myPolls.map(p => (
                <div key={p.id} className="bg-white/5 border border-white/10 p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-white/[0.07] transition-colors group">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h4 className="text-xl font-bold group-hover:text-secondary-pastel transition-colors">{p.title}</h4>
                       <span className="bg-primary-pastel/10 text-primary-pastel text-[9px] font-bold px-2 py-0.5 rounded border border-primary-pastel/20">#{p.pollCode}</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Type: <span className="text-gray-300 font-medium">{p.type}</span> | Created: <span className="text-gray-300 font-medium">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </p>
                    {p.endDate && (
                      <p className="text-[10px] text-accent-pastel mt-2 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-pastel"></span>
                        Auto-close: {new Date(p.endDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    {p.isActive ? (
                      <button 
                        onClick={() => onClosePoll(p.id)}
                        className="flex-1 md:flex-none bg-accent-pastel/10 text-accent-pastel border border-accent-pastel/30 px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-accent-pastel hover:text-white transition-all"
                      >
                        Close Now
                      </button>
                    ) : (
                      <span className="flex-1 md:flex-none text-center bg-gray-800 text-gray-400 border border-white/10 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest">Finalized</span>
                    )}
                    <Link to="/results" className="flex-1 md:flex-none text-center bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-2.5 rounded-xl text-xs font-bold transition-all">View Results</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <div className="text-4xl opacity-50">📂</div>
              <p className="text-gray-500 font-medium italic">You haven't initiated any decentralized polls yet.</p>
              <button onClick={() => setView('create')} className="text-secondary-pastel text-xs font-bold hover:underline">Create your first poll →</button>
            </div>
          )}
        </div>
      )}

      {!user && view === 'options' && (
        <div className="text-center opacity-40 py-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em]">Login to manage private moderated polls</p>
        </div>
      )}
    </div>
  );
};

export default Home;
