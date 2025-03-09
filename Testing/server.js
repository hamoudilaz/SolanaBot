import {
    VersionedTransaction,
    ComputeBudgetProgram,
    PublicKey,
} from '@solana/web3.js';
import { wallet, SlippageBps, jitoTip, prioFee } from './panelTest.js';
import { Agent, request as undiciRequest } from 'undici';
import dotenv from 'dotenv';
dotenv.config();

// AGENT CONFIG SETTINGS
const agent = new Agent({
    connections: 3,
    keepAliveTimeout: 2000,
    keepAliveMaxTimeout: 10_000,
    connect: {
        autoSelectFamily: true,
        autoSelectFamilyAttemptTimeout: 100,
        maxCachedSessions: 3,
        tls: {
            servername: 'api.jup.ag',
            rejectUnauthorized: true,
        },
    },
    headers: {
        'accept-encoding': 'br, gzip, deflate',
        'connection': 'keep-alive',
    },
});

// API's
const quoteApi = process.env.JUP_QUOTE;
const swapApi = process.env.JUP_SWAP;
const JITO_RPC = process.env.JITO_RPC;

export async function swap(inputmint, outputMint, amount, destination) {
    console.log(inputmint, outputMint, amount, destination)

    const url = `${quoteApi}?inputMint=${inputmint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${SlippageBps}&onlyDirectRoutes=true`;



    console.log('Requesting quote...');

    const { body: quoteRes } = await undiciRequest(url, { dispatcher: agent });

    const quote = await quoteRes.json();
    console.log('Quote received, requesting swap transaction...');

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
            destinationTokenAccount: destination,
        }),
        dispatcher: agent,
    });

    const { swapTransaction } = await swapRes.json();
    console.log('Swap transaction received, signing...');

    let transaction = VersionedTransaction.deserialize(
        Buffer.from(swapTransaction, 'base64')
    );

    let computeBudgetInstructionPrice = ComputeBudgetProgram.setComputeUnitPrice({
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

    const transactionBase64 = Buffer.from(transaction.serialize()).toString(
        'base64'
    );

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

                },
            ],
        }),
        dispatcher: agent,
    });

    // JITO RETURNS OUR SOLSCAN TX ID.

    const sendResult = await sendResponse.json();
    console.log(`Transaction confirmed: https://solscan.io/tx/${sendResult.result}`)
    return sendResult.result

}










