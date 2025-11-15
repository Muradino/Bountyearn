// solana.js
// Fully compatible with GitHub Pages
// Phantom wallet + dev wallet fallback
// Uses Solana devnet

// ---------------------------
// Solana Web3.js via CDN
// ---------------------------
const { Connection, PublicKey, clusterApiUrl, SystemProgram, Transaction } = window;

// ---------------------------
// Connection to devnet
// ---------------------------
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// ---------------------------
// Wallet management
// ---------------------------
let wallet = null;

export async function connectWallet() {
  // If already connected
  if (wallet) return wallet;

  // Check for Phantom
  if (window.solana && window.solana.isPhantom) {
    try {
      const resp = await window.solana.connect();
      wallet = window.solana;
      localStorage.setItem("wallet", resp.publicKey.toString());
      console.log("Phantom wallet connected:", resp.publicKey.toString());
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
  if (!wallet) return 0;

  if (wallet.publicKey.toBase58() === "DevWallet123456789") {
    return 10; // fake 10 SOL
  }

  try {
    const publicKey = new PublicKey(wallet.publicKey.toString());
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // lamports → SOL
  } catch (err) {
    console.error("Failed to get balance:", err);
    return 0;
  }
}

// ---------------------------
// Send SOL (real or simulated)
// ---------------------------
export async function sendSol(fromWallet, toPubKeyStr, amount) {
  if (!fromWallet) return false;

  if (fromWallet.publicKey.toBase58() === "DevWallet123456789") {
    console.log(`Simulated sending ${amount} SOL to ${toPubKeyStr}`);
    return true;
  }

  try {
    const toPubKey = new PublicKey(toPubKeyStr);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toPubKey,
        lamports: amount * 1e9,
      })
    );

    const { signature } = await fromWallet.signAndSendTransaction(transaction);
    console.log("Transaction signature:", signature);
    return signature;
  } catch (err) {
    console.error("Transaction failed:", err);
    return false;
  }
}
