
export interface Candidate {
  id: string;
  name: string;
}

export interface Poll {
  id: string;
  title: string;
  pollCode: string; // Unique access code for voting
  candidates: string[];
  isActive: boolean;
  createdAt: number;
  creatorEmail?: string;
  endDate?: string;
  type: 'default' | 'moderated';
  votes?: Record<string, number>;
}

export interface User {
  email: string;
  name: string;
  isLoggedIn: boolean;
}

export interface Vote {
  pollId: string;
  voterEmail: string;
  candidate: string;
  walletAddress: string;
}
