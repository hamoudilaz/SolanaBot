import { VersionedTransaction, ComputeBudgetProgram, PublicKey, } from '@solana/web3.js';
import { wallet, SlippageBps, jitoTip, prioFee, getBalance } from '../panel.js';
import Fastify from 'fastify';
import { Agent, request as undiciRequest } from 'undici';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import dotenv from 'dotenv';
dotenv.config();
const fastify = Fastify({ logger: false });

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
const quoteApi = process.env.JUP_QUOTE
const swapApi = process.env.JUP_SWAP
const JITO_RPC = process.env.JITO_RPC


// SOL MINT
const inputMint = 'So11111111111111111111111111111111111111112';

fastify.post('/buy', async (request, reply) => {
  const { outputMint, amount } = request.body;

  console.log("Transaction request recieved");

  if (!outputMint || !amount) {
    return reply.status(400).send({ error: 'Missing outputMint or amount' });
  }

  const start = Date.now();

  const ATA = getAssociatedTokenAddressSync(
    new PublicKey(outputMint),
    wallet.publicKey
  );



  // Ignore, just for testing
  // const { amountToSell, decimals } = await getBalance(outputMint)
  // const sell = Math.floor(amountToSell * 0.2);




  try {
    const url = `${quoteApi}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount * 1e9}&slippageBps=${SlippageBps}&onlyDirectRoutes=true`;

    console.log('Requesting quote...');

    const { body: quoteRes } = await undiciRequest(url, { dispatcher: agent });

    const quote = await quoteRes.json();

    if (quote.error) {
      console.error('Error getting quote:', quote.error);
      return reply.status(400).send({ error: quote.error })
    }
    console.log('Quote received, requesting swap transaction...');




    // The good thing about this bot is that we will get our ATA before even buying through getATA function.
    // This lets us set the destinationTokenAccount and skipUserAccountsRpcCalls to true in the swap request. This will save us some time and RPC calls.

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

    console.log(`Swapping ${amount} SOL for ${(quote.outAmount / 1000000).toFixed(3)} ${outputMint}`);

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

    // JITO RETURNS OUR SOLSCAN TX ID.

    const sendResult = await sendResponse.json();
    const end = Date.now() - start;

    console.log(`Transaction confirmed: https://solscan.io/tx/${sendResult.result}`);
    console.log('Overall time:' + end + 'ms');
    return reply.send({
      message: 'Swap executed successfully',
      outputMint,
      amount,
      expectedOutput: quote.outAmount,
      txId: `https://solscan.io/tx/${sendResult.result}`,
      Time: end,
    });
  } catch (error) {
    console.error('Error executing swap:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
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
