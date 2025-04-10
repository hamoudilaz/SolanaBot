import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = new Connection(process.env.RPC_URL, {
    wsEndpoint: process.env.WSS_SHYFT,
    commitment: 'confirmed',
});

let wallet;

let solMint
let otherMint;
let previousBalance = null;

export async function listenToWallets() {
    try {
        connection.onProgramAccountChange(
            TOKEN_PROGRAM_ID,
            async (data) => {
                const changedMint = AccountLayout.decode(data.accountInfo.data).mint.toBase58();


                if (changedMint !== solMint) {
                    console.log('Detected token mint:', changedMint);
                }

                // Fetch current SOL balance
                const currentBalance = await connection.getBalance(new PublicKey("4TJVWEFXqKL6gTCzhZ8mU4gzD6Zff6PQRFPK7wPvuo4e"));

                if (previousBalance !== null) {
                    if (currentBalance < previousBalance) {
                        console.log('BUY detected: Spent SOL for', changedMint);
                    } else if (currentBalance > previousBalance) {
                        console.log('SELL detected: Received SOL for', changedMint);
                    } else {
                        console.log('Unknown transaction:', changedMint);
                    }
                }

                previousBalance = currentBalance; // Upd
            },
            {
                commitment: 'processed',
                filters: [
                    {
                        dataSize: 165,
                    },
                    {
                        memcmp: {
                            offset: 32,
                            bytes: wallet,
                        },
                    },
                ],
            }
        );
    } catch (err) {
        console.error('Error listening to wallets:', err);
    }
}

listenToWallets();
