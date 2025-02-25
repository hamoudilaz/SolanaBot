import Fastify from "fastify";
import { wallet, getATA, connection } from "../panel.js";
import { VersionedTransaction } from "@solana/web3.js";

const fastify = Fastify({ logger: false });
const quoteApi = "https://api.jup.ag/swap/v1/quote";
const inputMint = "So11111111111111111111111111111111111111112";
const SlippageBps = 500; // 5% slippage

fastify.post("/buy", async (request, reply) => {



    try {

        const { outputMint, amount } = request.body;
        const start = Date.now();

        if (!outputMint || !amount) {
            return reply.status(400).send({ error: "Missing outputMint or amount" });
        }
        const ATA = getATA(outputMint);

        console.log("Fetching quote...");

        const quoteResponse = await fetch(
            `${quoteApi}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount * 1e9}&slippageBps=${SlippageBps}`
        );

        const quote = await quoteResponse.json();

        console.log("Requesting swap transaction...");
        console.log(ATA.toBase58());

        // The good thing about this bot is that we will get our ATA before even buying through getATA function.
        // This lets us set the destinationTokenAccount and skipUserAccountsRpcCalls to true in the swap request. This will save us some time and RPC calls.
        const swapResponse = await fetch("https://api.jup.ag/swap/v1/swap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userPublicKey: wallet.publicKey.toBase58(),
                prioritizationFeeLamports: {
                    priorityLevelWithMaxLamports: {
                        maxLamports: 10000,
                        global: false,
                        priorityLevel: "veryHigh",
                    },
                },
                wrapAndUnwrapSol: false,
                dynamicComputeUnitLimit: true,
                quoteResponse: quote,
                // wrapAndUnwrapSol: false, Enable only if you have WSOL ready. You can swap SOL > WSOL at https://jup.ag/. If you prepare WSOL and set this to true, Swap will be faster.
                skipUserAccountsRpcCalls: true,
                destinationTokenAccount: ATA.toBase58(),
            }),
        });

        const swapData = await swapResponse.json();

        if (!swapData.swapTransaction) {
            return reply.status(500).send({ error: "Failed to execute swap" });
        }

        console.log("✅ Swap transaction received, signing...");

        let transaction = VersionedTransaction.deserialize(
            Buffer.from(swapData.swapTransaction, "base64")
        );
        transaction.sign([wallet]);

        const transactionBinary = transaction.serialize();

        const signature = await connection.sendRawTransaction(transactionBinary, {
            maxRetries: 2,
            skipPreflight: true,
        });


        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}\nhttps://solscan.io/tx/${signature}/`);
        }

        const end = Date.now() - start;

        console.log(`Transaction confirmed! TX: ${signature}`);

        console.log("Overall time:" + end + "ms");
        return reply.send({
            message: "Swap executed successfully",
            outputMint,
            amount,
            expectedOutput: quote.outAmount,
            txId: `https://solscan.io/tx/${signature}`,
        });
    } catch (error) {
        console.error("Error executing swap:", error);
        return reply.status(500).send({ error: "Internal Server Error" });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: "localhost" });
        console.log("🚀 Server running on http://localhost:3000");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
