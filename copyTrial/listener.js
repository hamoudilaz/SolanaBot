import { executeSwap } from './copy.js';
import dotenv from 'dotenv';
import { connection, ws } from './copypanel.js';
dotenv.config();

// the wallet you want to monitor, defined in .env
const smart_wallet = process.env.smart_wallet;

// Amount in SOL to swap on each copy trade
const amount = 0.0001

let side

// Logic to extract the token mint from the transaction and execute swap
async function tx(tx) {
  const info = await connection.getTransaction(tx, {
    commitment: 'confirmed',
    maxSupportedTransactionVersion: 0,
  });

  console.log(info);
  return
  const meta = info.meta;

  const netChanges = {};
  meta.preTokenBalances.forEach((pre, i) => {
    const post = meta.postTokenBalances[i];
    const diff =
      Number(post.uiTokenAmount.amount) - Number(pre.uiTokenAmount.amount);
    const mint = pre.mint;
    netChanges[mint] = (netChanges[mint] || 0) + diff;
  });

  let solMint, tokenMint;
  Object.keys(netChanges).forEach((mint) => {
    if (mint === 'So11111111111111111111111111111111111111112') {
      solMint = mint;
    } else {
      tokenMint = mint;
    }
  });

  if (!solMint || !tokenMint) {
    console.log('Failed to find token mint');
    return;
  }
  console.log(`Swapping ${tokenMint} for SOL`);

  console.log(txid);
  return;
}

const txid = await executeSwap(tokenMint, solMint, amount);


ws.on('open', () => {
  console.log('Connected to Solana WebSocket');
  const subscriptionMessage = {
    jsonrpc: '2.0',
    id: 1,
    method: 'logsSubscribe',
    params: [
      {
        mentions: [smart_wallet],
      },
      {
        commitment: 'processed',
      },
    ],
  };
  ws.send(JSON.stringify(subscriptionMessage));
});

ws.on('message', async (data) => {
  const response = JSON.parse(data);

  if (response.method === 'logsNotification') {
    console.log('Transaction detected');

    const accountInfo = response.params.result.value.signature;
    const start = Date.now();
    await tx(accountInfo);

    const end = Date.now() - start;
    console.log('From detection to buy ' + end + ' ms');
  } else if (response.result) {
    console.log(`Subscription ID: ${response.result}`);
  }
});

ws.on('error', (error) => {
  console.error(`WebSocket error: ${error.message}`);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});
