
import React, { useState } from 'react';
import { Poll } from '../types';

interface PollListProps {
  polls: Poll[];
  onVote: (pollId: string, candidate: string) => void;
}

const PollList: React.FC<PollListProps> = ({ polls, onVote }) => {
  const [step, setStep] = useState<'join' | 'identity' | 'candidate'>('join');
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const [voterName, setVoterName] = useState('');
  const [voterWallet, setVoterWallet] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  const handleJoin = () => {
    const input = joinInput.trim().toUpperCase();
    // Support either direct code or full URL paste
    const code = input.includes('ID=') ? input.split('ID=')[1] : input;
    
    const found = polls.find(p => p.pollCode.toUpperCase() === code || p.id.toUpperCase() === code);
    
    if (found) {
      if (!found.isActive) {
        alert("This poll has been closed.");
        return;
      }
      setActivePoll(found);
      setStep('identity');
    } else {
      alert("Poll code not found. Please check your link or code.");
    }
  };

  const handleIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (voterName.length < 2 || voterWallet.length < 10) {
      alert("Please enter a valid name and wallet address (10+ characters).");
      return;
    }
    setStep('candidate');
  };

  const handleFinalVote = () => {
    if (!selectedCandidate || !activePoll) return;
    onVote(activePoll.id, selectedCandidate);
    alert(`Thank you, ${voterName}! Your vote for "${selectedCandidate}" has been secured on the blockchain.`);
    reset();
  };

  const reset = () => {
    setStep('join');
    setActivePoll(null);
    setJoinInput('');
    setVoterName('');
    setVoterWallet('');
    setSelectedCandidate(null);
  };

  return (
    <div className="max-w-xl mx-auto animate-[fadeIn_0.5s_ease]">
      {step === 'join' && (
        <div className="glass p-10 rounded-[32px] text-center space-y-6">
          <div className="w-16 h-16 bg-secondary-pastel/10 border border-secondary-pastel/30 rounded-full flex items-center justify-center mx-auto text-3xl">🔑</div>
          <h3 className="text-2xl font-bold">Join a Poll</h3>
          <p className="text-gray-400 text-sm">Paste your Poll Code or Invite Link to participate in the decentralized vote.</p>
          <div className="space-y-4">
            <input 
              type="text"
              placeholder="Enter Code (e.g. CITY-77)"
              value={joinInput}
              onChange={e => setJoinInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-secondary-pastel text-center font-mono font-bold"
            />
            <button 
              onClick={handleJoin}
              className="btn-gradient w-full py-4 rounded-2xl font-bold text-lg"
            >
              Verify & Join
            </button>
          </div>
        </div>
      )}

      {step === 'identity' && activePoll && (
        <div className="glass p-10 rounded-[32px] space-y-6 animate-[fadeUpCard_0.3s_ease]">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{activePoll.title}</h3>
            <p className="text-xs text-primary-pastel uppercase font-bold mt-1">Identity Verification Required</p>
          </div>
          
          <form onSubmit={handleIdentitySubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase">Your Full Name</label>
              <input 
                type="text"
                required
                value={voterName}
                onChange={e => setVoterName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-secondary-pastel"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-2 uppercase">Blockchain Wallet Address</label>
              <input 
                type="text"
                required
                value={voterWallet}
                onChange={e => setVoterWallet(e.target.value)}
                placeholder="0x..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-secondary-pastel font-mono text-sm"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="submit" className="btn-gradient flex-1 py-4 rounded-2xl font-bold">Proceed to Candidates</button>
              <button type="button" onClick={reset} className="bg-white/5 px-6 py-4 rounded-2xl font-bold text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {step === 'candidate' && activePoll && (
        <div className="glass p-8 rounded-[32px] space-y-6 animate-[fadeUpCard_0.3s_ease]">
          <div className="text-center">
            <h3 className="text-2xl font-bold">{activePoll.title}</h3>
            <p className="text-sm text-gray-400 mt-2">Voter: <span className="text-secondary-pastel font-bold">{voterName}</span></p>
          </div>

          <div className="grid gap-3">
            {activePoll.candidates.map(can => (
              <label 
                key={can}
                className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${selectedCandidate === can ? 'bg-secondary-pastel/20 border-secondary-pastel' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
              >
                <span className="font-bold">{can}</span>
                <input 
                  type="radio" 
                  name="final_candidate" 
                  value={can} 
                  className="hidden"
                  onChange={() => setSelectedCandidate(can)} 
                />
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedCandidate === can ? 'border-secondary-pastel bg-secondary-pastel' : 'border-white/20'}`}>
                  {selectedCandidate === can && <div className="w-2 h-2 rounded-full bg-dark-bg"></div>}
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              disabled={!selectedCandidate}
              onClick={handleFinalVote}
              className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${selectedCandidate ? 'btn-gradient scale-100 opacity-100' : 'bg-white/5 opacity-50 cursor-not-allowed'}`}
            >
              Secure Vote
            </button>
            <button onClick={reset} className="bg-white/5 px-6 py-4 rounded-2xl font-bold text-sm">Abort</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollList;
