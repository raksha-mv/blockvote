
import React, { useState, useEffect } from 'react';
import { Poll } from '../types';

declare var confetti: any;

interface ResultsProps {
  polls: Poll[];
}

const Results: React.FC<ResultsProps> = ({ polls }) => {
  const [wallet, setWallet] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isVerified) {
      // If there are any closed polls, trigger confetti once
      const hasClosedPolls = polls.some(p => !p.isActive);
      if (hasClosedPolls && typeof confetti !== 'undefined') {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
      }
    }
  }, [isVerified, polls]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet.trim().length >= 10) {
      setIsVerified(true);
    } else {
      alert("Please enter a valid simulated blockchain wallet address (10+ characters).");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {!isVerified ? (
        <div className="glass p-12 rounded-[48px] text-center max-w-lg mx-auto space-y-8 animate-[fadeUpCard_0.4s_ease]">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-pastel/20 to-secondary-pastel/20 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-2xl">
            <span className="text-5xl">🔭</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Audit Results</h2>
            <p className="text-gray-400 text-sm">Every vote is immutable. Provide your wallet signature to audit the live consensus.</p>
          </div>
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary-pastel uppercase tracking-widest ml-1">Blockchain Wallet Address</label>
              <input 
                type="text" 
                required
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                placeholder="0x71C7656EC7ab88b098defB751B74..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 outline-none focus:border-secondary-pastel transition-all text-center font-mono text-sm shadow-inner"
              />
            </div>
            <button type="submit" className="btn-gradient w-full py-5 rounded-2xl font-bold text-xl shadow-xl hover:scale-[1.02] transition-transform">
              Unlock Consensus Data
            </button>
          </form>
          <p className="text-[10px] text-gray-500 italic">Access is logged and verified on the peer network.</p>
        </div>
      ) : (
        <div className="space-y-10 animate-[fadeIn_0.5s_ease]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-6 rounded-[32px] border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-success-pastel/20 flex items-center justify-center text-success-pastel">✓</div>
              <div>
                <h2 className="text-2xl font-bold">Verified Audit</h2>
                <p className="text-[10px] text-secondary-pastel font-mono truncate max-w-[200px] md:max-w-xs opacity-70">Authenticated: {wallet}</p>
              </div>
            </div>
            <button onClick={() => setIsVerified(false)} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-xs font-bold border border-white/10 transition-all uppercase tracking-widest">Revoke Access</button>
          </div>
          
          <div className="grid gap-8">
            {polls.map(p => {
              const voteValues = Object.values(p.votes || {}) as number[];
              const totalVotes = voteValues.reduce((a, b) => a + b, 0);
              const isClosed = !p.isActive;

              return (
                <div key={p.id} className="glass p-10 rounded-[40px] space-y-8 relative overflow-hidden group">
                  {isClosed && (
                    <div className="absolute top-0 right-0 p-6">
                      <div className="bg-accent-pastel text-white text-[10px] font-bold px-4 py-1.5 rounded-full rotate-12 shadow-xl border border-white/20 animate-bounce">
                        FINALIZED WINNER
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl font-bold group-hover:text-secondary-pastel transition-colors">{p.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                         <span className="text-[10px] font-bold text-primary-pastel uppercase bg-primary-pastel/10 px-3 py-1 rounded-full border border-primary-pastel/20 tracking-widest">Protocol Code: {p.pollCode}</span>
                         <span className="text-xs text-gray-400 font-medium">Global Votes: <span className="text-white">{totalVotes}</span></span>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border uppercase tracking-[0.2em] shadow-sm ${p.isActive ? 'border-success-pastel text-success-pastel bg-success-pastel/10' : 'border-gray-500 text-gray-500 bg-gray-500/10'}`}>
                      {p.isActive ? 'Live Stream' : 'Archive'}
                    </span>
                  </div>

                  <div className="space-y-6">
                    {p.candidates.map(can => {
                      const count = p.votes?.[can] || 0;
                      const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                      const isWinner = !p.isActive && count === Math.max(...voteValues);

                      return (
                        <div key={can} className={`space-y-3 p-4 rounded-2xl transition-all ${isWinner ? 'bg-secondary-pastel/5 border border-secondary-pastel/20' : ''}`}>
                          <div className="flex justify-between text-sm items-center">
                            <span className={`font-bold text-base ${isWinner ? 'text-secondary-pastel' : ''}`}>
                              {can} {isWinner && '👑'}
                            </span>
                            <span className="text-gray-300 font-mono text-xs">{count} <span className="text-[10px] opacity-50 ml-1">CONFIRMED</span> ({percent}%)</span>
                          </div>
                          <div className="h-5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(110,231,222,0.2)] ${isWinner ? 'bg-gradient-to-r from-secondary-pastel to-primary-pastel animate-pulse' : 'bg-white/20'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="pt-6 border-t border-white/10 text-[10px] text-gray-500 flex flex-col md:flex-row justify-between items-center gap-2 italic">
                    <span className="font-mono bg-white/5 px-3 py-1 rounded-lg">Hash: {Math.random().toString(16).substr(2, 24).toUpperCase()}</span>
                    <span className="text-success-pastel font-bold uppercase tracking-widest flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success-pastel"></span> 
                      Blockchain Integrity Verified
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
