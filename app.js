// app.js
// Works with solana.js and all HTML pages

import { connectWallet, getBalance, sendSol } from "./solana.js";

// -------------------------------
// UTILITIES
// -------------------------------

// Load JSON from localStorage
function loadDB(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// Save JSON to localStorage
function saveDB(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Generate random ID
function id() {
  return "id_" + Math.random().toString(36).substring(2, 10);
}

// -------------------------------
// GLOBAL STATE
// -------------------------------
let currentWallet = null;

// -------------------------------
// CONNECT WALLET HANDLER
// -------------------------------
async function handleConnectWallet() {
  currentWallet = await connectWallet();
  const address = currentWallet.publicKey.toBase58();

  // Update UI anywhere the button exists
  const btn = document.getElementById("connectWalletBtn");
  if (btn) btn.textContent = address.substring(0, 6) + "..." + address.slice(-4);

  // Show balance if dashboard
  const balBox = document.getElementById("walletBalance");
  if (balBox) {
    const bal = await getBalance(currentWallet);
    balBox.textContent = bal + " SOL";
  }
}

// Auto-bind "Connect Wallet" if exists
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("connectWalletBtn");
  if (btn) btn.addEventListener("click", handleConnectWallet);
});

// -------------------------------
// CREATE BOUNTY
// -------------------------------
export function initCreatePage() {
  const form = document.getElementById("createForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    currentWallet = await connectWallet();
    const creator = currentWallet.publicKey.toBase58();

    const title = document.getElementById("title").value;
    const desc = document.getElementById("description").value;
    const reward = parseFloat(document.getElementById("reward").value);
    const deadline = document.getElementById("deadline").value;

    const bounties = loadDB("bounties");

    const newBounty = {
      id: id(),
      title,
      desc,
      reward,
      deadline,
      creator,
      winner: null,
      status: "open",
      createdAt: Date.now(),
    };

    bounties.push(newBounty);
    saveDB("bounties", bounties);

    alert("Bounty created!");

    window.location.href = "dashboard.html";
  });
}

// -------------------------------
// DASHBOARD
// -------------------------------
export function initDashboardPage() {
  const table = document.getElementById("bountyList");
  if (!table) return;

  const bounties = loadDB("bounties");

  bounties.forEach((b) => {
    const row = document.createElement("div");
    row.className = "border p-4 rounded bg-white mb-3";

    row.innerHTML = `
      <h3 class="font-bold">${b.title}</h3>
      <p>${b.desc.substring(0, 120)}...</p>
      <p class="text-sm mt-2">Reward: ${b.reward} SOL</p>
      <a href="bounty.html?id=${b.id}" class="text-blue-500 mt-2 inline-block">View</a>
    `;

    table.appendChild(row);
  });
}

// -------------------------------
// BOUNTY DETAILS PAGE
// -------------------------------
export function initBountyPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const bountyId = urlParams.get("id");
  if (!bountyId) return;

  const bounties = loadDB("bounties");
  const submissions = loadDB("submissions");
  const bounty = bounties.find((b) => b.id === bountyId);

  if (!bounty) return alert("Bounty not found!");

  document.getElementById("title").textContent = bounty.title;
  document.getElementById("desc").textContent = bounty.desc;
  document.getElementById("reward").textContent = bounty.reward + " SOL";

  // Show submissions
  const subBox = document.getElementById("submissionsBox");
  const filtered = submissions.filter((s) => s.bountyId === bountyId);

  filtered.forEach((s) => {
    const card = document.createElement("div");
    card.className = "p-3 border rounded bg-white mb-3";
    card.innerHTML = `
      <p class="font-bold">${s.link}</p>
      <p>${s.comment}</p>
      ${bounty.creator === localStorage.getItem("wallet") ? 
        `<button class="approveBtn bg-green-500 text-white px-3 py-1 rounded mt-2" data-id="${s.id}">Approve</button>` 
        : ""}
    `;
    subBox.appendChild(card);
  });

  // Handle Approve Winner
  document.querySelectorAll(".approveBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const subId = e.target.dataset.id;
      approveWinner(bountyId, subId);
    });
  });
}

// -------------------------------
// SUBMIT WORK PAGE
// -------------------------------
export function initSubmitPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const bountyId = urlParams.get("id");

  const form = document.getElementById("submitForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    currentWallet = await connectWallet();
    const submitter = currentWallet.publicKey.toBase58();

    const link = document.getElementById("submissionLink").value;
    const comment = document.getElementById("comment").value;

    const submissions = loadDB("submissions");

    submissions.push({
      id: id(),
      bountyId,
      link,
      comment,
      submitter,
      submittedAt: Date.now()
    });

    saveDB("submissions", submissions);

    alert("Submission sent!");
    window.location.href = `bounty.html?id=${bountyId}`;
  });
}

// -------------------------------
// APPROVE WINNER
// -------------------------------
async function approveWinner(bountyId, submissionId) {
  currentWallet = await connectWallet();

  let bounties = loadDB("bounties");
  let submissions = loadDB("submissions");

  const bounty = bounties.find((b) => b.id === bountyId);
  const submission = submissions.find((s) => s.id === submissionId);

  if (!bounty || !submission) return;

  const recipient = submission.submitter;

  await sendSol(currentWallet, recipient, bounty.reward);

  bounty.status = "closed";
  bounty.winner = recipient;

  saveDB("bounties", bounties);

  alert("Winner approved and SOL sent!");
  window.location.reload();
}
