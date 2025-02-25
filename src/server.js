import { VersionedTransaction, ComputeBudgetProgram } from "@solana/web3.js";
import { getATA, wallet, SlippageBps, jitoTip, prioFee } from "../panel.js";
import Fastify from "fastify";

const fastify = Fastify({ logger: false });

const JITO_RPC =
  "https://frankfurt.mainnet.block-engine.jito.wtf/api/v1/transactions";

const quoteApi = "https://api.jup.ag/swap/v1/quote";

const inputMint = "So11111111111111111111111111111111111111112";


fastify.post("/buy", async (request, reply) => {

  const start = Date.now();
  const { outputMint, amount } = request.body;
  const ATA = getATA(outputMint);

  if (!outputMint || !amount) {
    return reply.status(400).send({ error: "Missing outputMint or amount" });
  }
  try {
    console.log("Fetching quote...");

    const quoteResponse = await fetch(
      `${quoteApi}?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount * 1e9}&slippageBps=${SlippageBps}`
    );
    const quote = await quoteResponse.json();

    console.log("Requesting swap transaction...");


    // The good thing about this bot is that we will get our ATA before even buying through getATA function.
    // This lets us set the destinationTokenAccount and skipUserAccountsRpcCalls to true in the swap request. This will save us some time and RPC calls.
    const swapResponse = await fetch("https://api.jup.ag/swap/v1/swap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userPublicKey: wallet.publicKey.toBase58(),
        prioritizationFeeLamports: { jitoTipLamports: jitoTip },
        dynamicComputeUnitLimit: true,
        quoteResponse: quote,
        // wrapAndUnwrapSol: false, Enable only if you have WSOL ready. You can swap SOL > WSOL at https://jup.ag/.
        skipUserAccountsRpcCalls: true,
        destinationTokenAccount: ATA.toBase58(),
      }),
    });

    const swapData = await swapResponse.json();

    if (!swapData.swapTransaction) {
      return reply.status(500).send({ error: "Failed to execute swap" });
    }

    console.log("Swap transaction received, signing...");


    let transaction = VersionedTransaction.deserialize(
      Buffer.from(swapData.swapTransaction, "base64")
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

    transaction.message.compiledInstructions.unshift(
      computeBudgetCompiledInstructionPrice
    );

    transaction.sign([wallet]);

    const transactionBinary = transaction.serialize();

    const transactionBase64 = Buffer.from(transactionBinary).toString("base64");

    console.log("Transaction sent to jito...");

    const sendResponse = await fetch(JITO_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "sendTransaction",
        params: [
          transactionBase64,
          {
            encoding: "base64",
            skipPreflight: true,
            preflightCommitment: "processed",
          },
        ],
      }),
    });



    const sendResult = await sendResponse.json();
    const end = Date.now() - start;

    console.log(`Transaction confirmed! TX: ${sendResult.result}`);
    console.log("Overall time:" + end + "ms");
    return reply.send({
      message: "Swap executed successfully",
      outputMint,
      amount,
      expectedOutput: quote.outAmount,
      txId: `https://solscan.io/tx/${sendResult.result}`,
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
