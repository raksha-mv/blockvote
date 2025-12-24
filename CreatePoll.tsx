
import React, { useState } from 'react';
import { User, Poll } from '../types';

interface CreatePollProps {
  user: User | null;
  onSuccess: (poll: Poll) => void;
  onBack: () => void;
}

const CreatePoll: React.FC<CreatePollProps> = ({ user, onSuccess, onBack }) => {
  const [title, setTitle] = useState('');
  const [candidates, setCandidates] = useState(['', '']);
  const [type, setType] = useState<'default' | 'moderated'>('default');
  const [endDate, setEndDate] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [generatedPoll, setGeneratedPoll] = useState<Poll | null>(null);

  const addCandidate = () => setCandidates([...candidates, '']);
  
  const removeCandidate = (index: number) => {
    if (candidates.length <= 2) {
      alert("A poll must have at least 2 candidates.");
      return;
    }
    const newCans = candidates.filter((_, i) => i !== index);
    setCandidates(newCans);
  };

  const updateCandidate = (idx: number, val: string) => {
    const newCans = [...candidates];
    newCans[idx] = val;
    setCandidates(newCans);
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && type === 'moderated') {
      alert("Please login to create moderated polls.");
      return;
    }

    const pollId = Math.random().toString(36).substr(2, 9);
    const pollCode = generateCode();

    const newPoll: Poll = {
      id: pollId,
      title,
      pollCode,
      candidates: candidates.filter(c => c.trim() !== ''),
      isActive: true,
      createdAt: Date.now(),
      creatorEmail: user?.email,
      type,
      endDate: type === 'moderated' ? endDate : undefined,
      votes: candidates.reduce((acc, c) => ({ ...acc, [c]: 0 }), {})
    };

    onSuccess(newPoll);
    setGeneratedPoll(newPoll);
    setIsCreated(true);
  };

  if (isCreated && generatedPoll) {
    const shareLink = `${window.location.origin}${window.location.pathname}#/vote?id=${generatedPoll.id}`;
    
    return (
      <div className="glass p-12 rounded-[36px] text-center max-w-2xl mx-auto space-y-8 animate-[fadeUpCard_0.5s_ease]">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-success-pastel">✓ Poll Created</h2>
          <p className="text-lg text-gray-300">Your poll is now live on the blockchain.</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
          <div>
            <p className="text-xs font-bold text-primary-pastel mb-1 uppercase tracking-widest">Access Code</p>
            <div className="text-3xl font-mono font-bold tracking-tighter text-secondary-pastel bg-white/5 p-3 rounded-lg border border-secondary-pastel/20 select-all">
              {generatedPoll.pollCode}
            </div>
            <p className="text-[10px] text-gray-500 mt-2 italic">Voters will need this code to unlock the poll.</p>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-xs font-bold text-primary-pastel mb-1 uppercase tracking-widest">Shareable Link</p>
            <div className="flex gap-2">
              <input 
                readOnly 
                value={shareLink} 
                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-xs truncate text-gray-400"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(shareLink);
                  alert("Link copied!");
                }}
                className="bg-primary-pastel/20 text-primary-pastel px-3 py-1 rounded-lg text-xs font-bold border border-primary-pastel/30"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <button onClick={onBack} className="btn-gradient px-8 py-3 rounded-xl font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="glass p-8 rounded-[36px] max-w-2xl mx-auto animate-[fadeUpCard_0.4s_ease]">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Create New Poll</h2>
        <button onClick={onBack} className="text-gray-400 hover:text-white">← Back</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-primary-pastel font-medium text-sm">Poll Type</label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setType('default')}
              className={`p-4 rounded-xl border text-left transition-all ${type === 'default' ? 'border-primary-pastel bg-primary-pastel/10' : 'border-white/10 bg-white/5 opacity-60'}`}
            >
              <h4 className="font-bold">Default</h4>
              <p className="text-[10px] text-gray-400">Standard community poll</p>
            </button>
            <button
              type="button"
              onClick={() => setType('moderated')}
              className={`p-4 rounded-xl border text-left transition-all ${type === 'moderated' ? 'border-primary-pastel bg-primary-pastel/10' : 'border-white/10 bg-white/5 opacity-60'}`}
            >
              <h4 className="font-bold">Moderated</h4>
              <p className="text-[10px] text-gray-400">Set closing time & ownership</p>
            </button>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-primary-pastel font-medium text-sm">Poll Title</label>
          <input 
            type="text" 
            required 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-secondary-pastel focus:bg-white/10 transition-all"
            placeholder="e.g., Best Tech Trend of 2025"
          />
        </div>

        <div className="space-y-3 text-left">
          <label className="text-primary-pastel font-medium text-sm">Candidates</label>
          {candidates.map((c, idx) => (
            <div key={idx} className="flex gap-2">
              <input 
                type="text" 
                required 
                value={c}
                onChange={e => updateCandidate(idx, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-secondary-pastel transition-all"
                placeholder={`Candidate ${idx + 1}`}
              />
              <button 
                type="button" 
                onClick={() => removeCandidate(idx)}
                className="bg-accent-pastel/10 border border-accent-pastel/20 text-accent-pastel p-3 rounded-xl hover:bg-accent-pastel hover:text-white transition-colors"
                title="Remove Candidate"
              >
                ✕
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={addCandidate}
            className="text-xs font-bold text-secondary-pastel hover:underline ml-1"
          >
            + Add another candidate
          </button>
        </div>

        {type === 'moderated' && (
          <div className="space-y-2 text-left">
            <label className="text-primary-pastel font-medium text-sm">Auto-Close Settings</label>
            <input 
              type="datetime-local" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none text-gray-300"
            />
          </div>
        )}

        <button type="submit" className="btn-gradient w-full py-4 rounded-2xl text-xl font-bold mt-4 shadow-xl">
          Create & Generate Code
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;
