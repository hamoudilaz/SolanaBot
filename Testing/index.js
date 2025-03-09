import { PublicKey } from '@solana/web3.js';
import { wallet, getBalance } from './panelTest.js';
import Fastify from 'fastify';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import dotenv from 'dotenv';
import { swap } from './server.js';
dotenv.config();
const fastify = Fastify({ logger: false });



let SOL = 'So11111111111111111111111111111111111111112';
let PDA = 'YOUR_PDA_ADDRESS';

function getATA(outputMint) {
    return getAssociatedTokenAddressSync(
        new PublicKey(outputMint),
        wallet.publicKey
    );
}

let inputMint;

fastify.post('/swap', async (request, reply) => {
    let { type, outputMint, amount } = request.body;

    if (type === 'buy') {
        inputMint = SOL;
        const buyAmount = amount * 1e9;
        const ATA = getATA(outputMint).toBase58();
        const executeSwap = await swap(inputMint, outputMint, buyAmount, ATA);
        return reply.send(`Transaction confirmed: https://solscan.io/tx/${executeSwap}`);
    }

    if (type === 'sell') {
        const { amountToSell, decimals } = await getBalance(outputMint);
        const sellAmount = Math.floor((amountToSell * amount) / 100) * Math.pow(10, decimals);
        inputMint = outputMint;
        outputMint = SOL;
        const executeSwap = await swap(inputMint, outputMint, sellAmount, PDA);
        return reply.send(`Transaction confirmed: https://solscan.io/tx/${executeSwap}`);
    }

});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: 'localhost' });
        console.log('🚀 Server running on http://localhost:3000');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
