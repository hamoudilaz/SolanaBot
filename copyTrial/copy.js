import {
    VersionedTransaction,
    ComputeBudgetProgram,
    PublicKey,
} from '@solana/web3.js';
import { wallet, SlippageBps, jitoTip, prioFee } from './copypanel.js';

import { Agent, request as undiciRequest } from 'undici';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import dotenv from 'dotenv';
dotenv.config();

const agent = new Agent({
    connections: 3, // Matches your exact number of concurrent requests
    keepAliveTimeout: 2000, // 2 seconds (matches typical API response times)
    keepAliveMaxTimeout: 10_000, // 10 seconds (prevents hanging connections)
    connect: {
        autoSelectFamily: true, // Enables IPv4/IPv6 dual-stack for faster DNS resolution
        autoSelectFamilyAttemptTimeout: 100, // 100ms for IP family selection
        maxCachedSessions: 3, // Matches connection pool size
        tls: {
            servername: 'api.jup.ag', // Ensures correct SNI for Jupiter API
            rejectUnauthorized: true, // Ensures secure TLS (default, but explicit for clarity)
        },
    },
    headers: {
        'accept-encoding': 'br, gzip, deflate', // Enables response compression
        'connection': 'keep-alive', // Explicitly enables keep-alive (reduces handshake overhead)
    },
});



// API's
const quoteApi = process.env.JUP_QUOTE;
const swapApi = process.env.JUP_SWAP;
const JITO_RPC = process.env.JITO_RPC;

export async function executeSwap(outputMint, inputMint, amount) {

    const ATA = getAssociatedTokenAddressSync(new PublicKey(outputMint), wallet.publicKey);
    try {
        const start = Date.now();

        const url = `${quoteApi}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount * 1e9}&slippageBps=${SlippageBps}&onlyDirectRoutes=true`;

        const { body: quoteRes } = await undiciRequest(url, { dispatcher: agent });

        const quote = await quoteRes.json();


        console.log('Requesting swap transaction...');

        const { body: swapRes } = await undiciRequest(swapApi, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userPublicKey: wallet.publicKey.toBase58(),
                prioritizationFeeLamports: { jitoTipLamports: jitoTip },
                dynamicComputeUnitLimit: true,
                quoteResponse: quote,
                wrapAndUnwrapSol: false,
                skipUserAccountsRpcCalls: true,
                destinationTokenAccount: ATA.toBase58(),
            }),
            dispatcher: agent,
        });

        const { swapTransaction } = await swapRes.json();

        console.log('Swap transaction received, signing...');

        let transaction = VersionedTransaction.deserialize(
            Buffer.from(swapTransaction, 'base64')
        );

        let computeBudgetInstructionPrice =
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: prioFee,
            });

        const computeBudgetCompiledInstructionPrice = {
            programIdIndex: transaction.message.staticAccountKeys.findIndex(
                (key) =>
                    key.toBase58() === computeBudgetInstructionPrice.programId.toBase58()
            ),
            accountKeyIndexes: computeBudgetInstructionPrice.keys.map((key) =>
                transaction.message.staticAccountKeys.findIndex(
                    (acc) => acc.toBase58() === key.pubkey.toBase58()
                )
            ),
            data: new Uint8Array(computeBudgetInstructionPrice.data),
        };

        transaction.message.compiledInstructions.splice(
            1,
            0,
            computeBudgetCompiledInstructionPrice
        );

        transaction.sign([wallet]);

        const transactionBase64 = Buffer.from(transaction.serialize()).toString('base64');

        console.log('Transaction sent to jito...');

        // THIS IS THE LAST STEP!
        const { body: sendResponse } = await undiciRequest(JITO_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: 1,
                jsonrpc: '2.0',
                method: 'sendTransaction',
                params: [
                    transactionBase64,
                    {
                        encoding: 'base64',
                        skipPreflight: true,
                    },
                ],
            }),
            dispatcher: agent,
        });

        const sendResult = await sendResponse.json();
        const end = Date.now() - start;
        const txid = `https://solscan.io/tx/${sendResult.result}`;
        return txid;
    } catch (error) {
        console.log(error);
    }
}
