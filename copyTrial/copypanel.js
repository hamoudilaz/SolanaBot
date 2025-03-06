import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';
import WebSocket from 'ws';
dotenv.config();

const connection = new Connection(process.env.RPC_URL, 'confirmed');

const ws = new WebSocket(process.env.WSS_URL);

const SlippageBps = 340; // 34% slippage
const jitoTip = 1000; // 0.000001 SOL
const prioFee = 1000; // 0.000001 SOL

const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY_2));

const userPublicKey = wallet.publicKey.toBase58();

console.log('Your PublicKey:' + userPublicKey);





// iGNORE!, just for testing
/* 
async function getBalance(outputMint) {
    console.log(outputMint);

    const getDecimal = await fetch(
        `https://api.jup.ag/tokens/v1/token/${outputMint}`
    );
    const tokenInfo = await getDecimal.json();

    const mintAddress = new PublicKey(outputMint);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletAddress,
        {
            mint: mintAddress,
        }
    );

    return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
} */

// FIX: Check properly for empty results

export { wallet, SlippageBps, jitoTip, prioFee, connection, ws };
