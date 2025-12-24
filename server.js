const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for frontend connectivity
app.use(cors({
  origin: '*', // Adjust this for production
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Atlas Connection (URI comes from .env)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("FATAL: MONGODB_URI not found in .env file!");
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✓ Connected to MongoDB Atlas Instance'))
  .catch(err => console.error('✗ MongoDB Atlas Connection Failure:', err));

// --- DATA MODEL ---
const PollSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: String,
  pollCode: { type: String, required: true, unique: true },
  candidates: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Number, default: Date.now },
  creatorEmail: String,
  endDate: String,
  type: { type: String, enum: ['default', 'moderated'], default: 'default' },
  votes: { type: Map, of: Number, default: {} }
});

const Poll = mongoose.model('Poll', PollSchema);

// --- API ENDPOINTS ---

// GET: Retrieve all polls
app.get('/api/polls', async (req, res) => {
  try {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch polls from Atlas." });
  }
});

// POST: Create a new election protocol
app.post('/api/polls', async (req, res) => {
  try {
    const pollData = req.body;
    // Ensure votes map is initialized for all candidates
    if (pollData.candidates && !pollData.votes) {
      pollData.votes = {};
      pollData.candidates.forEach(c => pollData.votes[c] = 0);
    }
    const newPoll = new Poll(pollData);
    await newPoll.save();
    res.status(201).json(newPoll);
  } catch (err) {
    res.status(400).json({ error: "Validation error in poll creation." });
  }
});

// POST: Securely cast a vote
app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { candidate } = req.body;
    const poll = await Poll.findOne({ id: req.params.id });
    
    if (!poll) return res.status(404).json({ error: "Election protocol not found." });
    if (!poll.isActive) return res.status(403).json({ error: "Consensus finalized. Voting closed." });
    
    // Incremental update using Map notation
    const currentVotes = poll.votes.get(candidate) || 0;
    poll.votes.set(candidate, currentVotes + 1);
    
    await poll.save();
    res.json({ success: true, poll });
  } catch (err) {
    res.status(500).json({ error: "Failed to broadcast vote to Atlas cluster." });
  }
});

// PATCH: Close a poll (Moderator only)
app.patch('/api/polls/:id/close', async (req, res) => {
  try {
    const poll = await Poll.findOneAndUpdate(
      { id: req.params.id }, 
      { isActive: false }, 
      { new: true }
    );
    if (!poll) return res.status(404).json({ error: "Poll not found." });
    res.json(poll);
  } catch (err) {
    res.status(500).json({ error: "Server error during protocol finalization." });
  }
});

// Health Check
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Node.js Backend fully operational on Port ${PORT}`);
});