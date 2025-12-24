
export const INITIAL_POLLS = [
  {
    id: 'p1',
    title: 'Favorite Programming Language 2025',
    pollCode: 'TS-2025',
    candidates: ['TypeScript', 'Python', 'Rust', 'Go'],
    isActive: true,
    createdAt: Date.now(),
    type: 'default',
    votes: { 'TypeScript': 45, 'Python': 38, 'Rust': 29, 'Go': 12 }
  },
  {
    id: 'p2',
    title: 'Future City Development Initiative',
    pollCode: 'CITY-77',
    candidates: ['Green Spaces', 'Smart Transit', 'Renewable Grid'],
    isActive: true,
    createdAt: Date.now() - 86400000,
    type: 'moderated',
    endDate: new Date(Date.now() + 86400000).toISOString(),
    votes: { 'Green Spaces': 150, 'Smart Transit': 89, 'Renewable Grid': 210 }
  }
];
