// solana.js
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from 'https://cdn.jsdelivr.net/npm/@solana/web3.js@latest/lib/index.esm.min.js';

// Connect to Solana Devnet
const connection = new Connection('https://api.devnet.solana.com');

let userWallet = null;

// Connect Wallet function
export async function connectWallet() {
  // Check if wallet exists in localStorage
  const stored = localStorage.getItem('wallet');
  if (stored) {
    const secret = Uint8Array.from(JSON.parse(stored));
    userWallet = Keypair.fromSecretKey(secret);
  } else {
    // Generate new wallet
    userWallet = Keypair.generate();
    localStorage.setItem('wallet', JSON.stringify(Array.from(userWallet.secretKey)));
  }
  return userWallet;
}

// Get SOL balance
export async function getBalance(wallet) {
  if (!wallet) return 0;
  const balance = await connection.getBalance(wallet.publicKey);
  return (balance / LAMPORTS_PER_SOL).toFixed(4); // convert lamports to SOL
}

// Send SOL from wallet to another (for future bounty payouts)
export async function sendSol(toPublicKeyStr, amount) {
  if (!userWallet) throw new Error('Wallet not connected');

  const toPublicKey = new PublicKey(toPublicKeyStr);
  const transaction = await connection.requestAirdrop(userWallet.publicKey, 1 * LAMPORTS_PER_SOL); // For devnet: top-up if empty

  // Note: Real transfer logic goes here (requires signed transaction)
  console.log(`Simulated sending ${amount} SOL to ${toPublicKey.toBase58()}`);
  return true;
}

// Get public key string
export function getPublicKey() {
  if (!userWallet) return null;
  return userWallet.publicKey.toBase58();
}

