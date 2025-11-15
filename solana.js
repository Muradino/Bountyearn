// solana.js
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Connect to Solana devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// ---------------------------
// Wallet management
// ---------------------------

let wallet = null; // current wallet object

export async function connectWallet() {
  // If wallet already connected
  if (wallet) return wallet;

  // Try Phantom Wallet
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      wallet = window.solana;
      localStorage.setItem("wallet", resp.publicKey.toString());
      return wallet;
    } catch (err) {
      console.error("Phantom connection failed:", err);
    }
  }

  // Fallback dev wallet
  if (!wallet) {
    wallet = {
      publicKey: {
        toBase58: () => "DevWallet123456789"
      },
      signTransaction: async (tx) => {
        console.warn("Dev wallet signing transaction (simulation).");
        return tx;
      },
      signAllTransactions: async (txs) => {
        console.warn("Dev wallet signing multiple transactions (simulation).");
        return txs;
      }
    };
    localStorage.setItem("wallet", wallet.publicKey.toBase58());
    console.warn("Using fallback dev wallet. Phantom not installed.");
  }

  return wallet;
}

// ---------------------------
// Get wallet SOL balance
// ---------------------------
export async function getBalance(wallet) {
  if (wallet && wallet.publicKey.toBase58() === "DevWallet123456789") {
    return 10; // fake 10 SOL for dev wallet
  }

  try {
    const publicKey = new PublicKey(wallet.publicKey.toString());
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // convert lamports to SOL
  } catch (err) {
    console.error("Failed to get balance:", err);
    return 0;
  }
}

// ---------------------------
// Send SOL (simulation for now)
// ---------------------------
export async function sendSol(fromWallet, toPublicKeyStr, amount) {
  if (fromWallet.publicKey.toBase58() === "DevWallet123456789") {
    console.log(`Simulated sending ${amount} SOL to ${toPublicKeyStr}`);
    return true;
  }

  try {
    const toPubKey = new PublicKey(toPublicKeyStr);
    const transaction = new window.solana.Transaction().add(
      window.solana.SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toPubKey,
        lamports: amount * 1e9,
      })
    );

    const signature = await fromWallet.signAndSendTransaction(transaction);
    console.log("Transaction signature:", signature);
    return signature;
  } catch (err) {
    console.error("Transaction failed:", err);
    return false;
  }
}
