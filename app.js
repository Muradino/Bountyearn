// app.js

// ----------------------------
// Helper functions
// ----------------------------

// Generate unique ID
function generateId(prefix = '') {
  return prefix + Math.random().toString(36).substr(2, 9);
}

// Get bounties from localStorage
export function getBounties() {
  const bounties = JSON.parse(localStorage.getItem('bounties') || '[]');
  return bounties;
}

// Save bounties to localStorage
function saveBounties(bounties) {
  localStorage.setItem('bounties', JSON.stringify(bounties));
}

// Get submissions from localStorage
export function getSubmissions() {
  return JSON.parse(localStorage.getItem('submissions') || '[]');
}

// Save submissions to localStorage
function saveSubmissions(submissions) {
  localStorage.setItem('submissions', JSON.stringify(submissions));
}

// ----------------------------
// Core Functions
// ----------------------------

// Create a new bounty
export function createBounty(title, description, reward, deadline, creator) {
  const bounties = getBounties();
  const bounty = {
    id: generateId('bounty-'),
    title,
    description,
    reward,
    deadline, // ISO string
    creator,
    status: 'open', // open | closed
  };
  bounties.push(bounty);
  saveBounties(bounties);
  return bounty;
}

// Submit work to a bounty
export function submitWork(bountyId, submitter, link, comment = '') {
  const submissions = getSubmissions();
  const submission = {
    submissionId: generateId('sub-'),
    bountyId,
    submitter,
    link,
    comment,
    approved: false
  };
  submissions.push(submission);
  saveSubmissions(submissions);
  return submission;
}

// Approve a winner
export function approveWinner(bountyId, submissionId) {
  const bounties = getBounties();
  const submissions = getSubmissions();

  const bounty = bounties.find(b => b.id === bountyId);
  if (!bounty || bounty.status !== 'open') return false;

  const winner = submissions.find(s => s.submissionId === submissionId);
  if (!winner) return false;

  // Mark bounty as closed
  bounty.status = 'closed';
  saveBounties(bounties);

  // Mark winner
  winner.approved = true;
  saveSubmissions(submissions);

  // Transfer reward (simulation)
  console.log(`Reward of ${bounty.reward} SOL sent to ${winner.submitter}`);
  return true;
}

// Auto-assign winner if deadline passed + 7 days
export function autoAssignWinner() {
  const bounties = getBounties();
  const submissions = getSubmissions();
  const now = new Date();

  bounties.forEach(bounty => {
    if (bounty.status !== 'open') return;

    const deadline = new Date(bounty.deadline);
    const autoTime = new Date(deadline.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days

    if (now >= autoTime) {
      // Pick first submission if exists
      const bountySubs = submissions.filter(s => s.bountyId === bounty.id);
      if (bountySubs.length > 0) {
        approveWinner(bounty.id, bountySubs[0].submissionId);
        console.log(`Auto-assigned winner for bounty ${bounty.title}`);
      }
    }
  });
}

// ----------------------------
// Auto-check every hour
// ----------------------------
setInterval(autoAssignWinner, 60 * 60 * 1000); // every 1 hour

