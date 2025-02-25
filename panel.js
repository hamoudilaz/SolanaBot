import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";

dotenv.config();

const SlippageBps = 500; // 5% slippage
const jitoTip = 10000; // 0.00001 SOL
const prioFee = 10000; // 0.00001 SOL


// Add .env file with PRIVATE_KEY=YourPrivateKey (Must be bs58 encoded! if not use the convert.js script to convert it)
const privateKey = process.env.PRIVATE_KEY;

const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));

const userPublicKey = wallet.publicKey.toBase58();

console.log("Your PublicKey:" + userPublicKey);



// Use mainnet RPC or your custom RPC URL.
// Note that we actually dont need a RPC connection for this bot since we just send the transaction to jito.
// If you want to use your own RPC you can remove the swapResponse Post request and add the following 

const connection = new Connection(process.env.RPC_URL, {
  commitment: "processed",
  confirmTransactionInitialTimeout: 10000,
});
console.log("Connected to RPC");

// Function to get the associated token address of a token mint. Helps with faster swaps
function getATA(tokenMint) {
  return getAssociatedTokenAddressSync(
    new PublicKey(tokenMint),
    new PublicKey(userPublicKey)
  );
}

export { getATA, connection, wallet, SlippageBps, jitoTip, prioFee };
