import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import dotenv from 'dotenv';

dotenv.config();

const SlippageBps = 340; // 34% slippage
const jitoTip = 1000; // 0.00001 SOL
const prioFee = 1000; // 0.00001 SOL
const connection = new Connection(process.env.RPC_URL, 'processed');

// Go to .env exampole file and add your private key (Must be bs58 encoded! if not use the convert.js script to convert it)
const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));

const userPublicKey = wallet.publicKey.toBase58();

console.log('Your PublicKey: ' + userPublicKey);


async function getBalance(outputMint) {
    const getDecimal = await fetch(
        `https://api.jup.ag/tokens/v1/token/${outputMint}`
    );

    const { decimals } = await getDecimal.json();

    const mintAddress = new PublicKey(outputMint);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        {
            mint: mintAddress,
        }
    );

    const amountToSell = Math.floor(
        tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
    );
    return { amountToSell, decimals };
}

export { wallet, SlippageBps, jitoTip, prioFee, getBalance };
