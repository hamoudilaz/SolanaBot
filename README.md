### Note:

#### This project is still a work in progress. I'm open to contributions and improvements. Feel free to fork the repository and submit a pull request! :)

# 🔥 Solana Trading Bot (Work in Progress)

This bot is still under development, but the buy process is implemented!

After spending endless time researching and testing Ive successfully figured out how the system works and implemented the **most important instruction,** executing buy orders smoothly with priofee and jitotip.

---

## ✨ What Makes This Bot Special?

✅ **Supports both `jitoTip` and `prioFee` simultaneously**.  
✅ **Open-source and completely free**—no 1% fee like other services.  
✅ **Beginner-friendly**—no coding knowledge required, everything is pre-built.

### 🤔 Isn’t that already supported by Jupiter's Swap API?

No! Even though Jupiter’s **API documentation** claims you can set both `prioFee` and `jitoTip` using `prioritizationFeeLamports`, that **does not work**.

- **The truth:** Jupiter’s Swap API **only accepts one**—either `prioFee` or `jitoTip`.
- **Even `/swap-instructions` does not allow both**—I confirmed this directly with Jupiter’s support.
- **So how does this bot do it?** I found a workaround that lets both fees work together by manually injecting the `prioFee` instruction into the transaction.

---

## 🚀 Getting Started

1. Clone the repo:
   ```sh
   git clone https://github.com/hamoudilaz/SolanaBot.git
   cd SolanaBot
   code .
   ```
2. Install packages:
   ```sh
   npm install
   ```
3. Run the bot to test server startup:
   ```sh
   npm start
   ```

## How to Use

### Step 1: Add Your Private Key

Open `.env example` file and add your private key:  
⚠️ **Must be in bs58 format!** If your private key is Uint8Array like [323,53.....] use the `convert.js` script inside the helper folder to convert it like this:

```js
// Converting from Uint8Array to bs58
// Paste your Uint8Array private key like this:
const privateKey = [178, 163,...]

const converted = bs58.encode(privateKey)
console.log("bs58 private key: " + converted); // Should return your private key in bs58 format, proceed to step 2
```

---

### Step 2: Load Your Private Key

Navigate to panel.js  
Load the private key from the `.env` fil e:

```js
// run node panel.js to make sure it logs your publickey

const privateKey = process.env.PRIVATE_KEY;

const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));

const userPublicKey = wallet.publicKey.toBase58();

console.log('Your PublicKey:' + userPublicKey); // Should return your wallet adress. If not recheck Step 1 and step 3 on "Getting started"
```

### Step 4: WebSocket and RPC Connection

Use **Mainnet RPC** or your **custom RPC URL**.  
Navigate to your .env and add your RPC_URL:

```js
// You can get a custom RPC from Quicknode.com or Helius.dev
RPC_URL=YourRPC

// Example: Solanas mainnet RPC (Slow! not recomended)
RPC_URL=https://api.mainnet-beta.solana.com  ()



const connection = new Connection(process.env.RPC_URL, {
  commitment: "processed",
  confirmTransactionInitialTimeout: 10000,
});
console.log("Connected to RPC");
```

> **Note:** This bot **does not require** an RPC connection since transactions are sent directly to **Jito**.
> **Hovwever** If you want to experiment on the new copy trade feature you will need both **WebSocket and RPC endpoints**.
> If you want to use your own RPC without sending the transaction to Jito navigate to **src/solana.js**. Not recommended because it is slow
> Use this command to run solana.js:

```sh
node src/solana.js
```

# How to Run the Bot

## 1️⃣ Start the Server

Open the terminal and run:

```sh
npm start
```

This will start the server.

---

## 2️⃣ Make a POST Request to `/buy`

Once the server is running, you can make a POST request to `http://localhost:3000/buy`.

### 🔹 Example Request using `curl`:

```sh
curl -X POST "http://localhost:3000/buy" \
     -H "Content-Type: application/json" \
     -d '{
           "outputMint": "TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6",
           "amount": 0.00001
         }'
```

### 🔹 Request Body Requirements:

- `outputMint` → The Token CA (Contract Address) of the token you want to buy.
- `amount` → The amount of SOL to use for the purchase.

You can modify the **Token CA** and **amount** as needed.

---

Once the post request is sent, the bot will execute the trade in under 400MS and return our solscan txid link!

---

# Successful Transaction Execution

## Running the Server

To start the server, run the following command:

```sh
npm start
```

You should see the following output:

```
Server running on http://localhost:3000
Your PublicKey: 7dGrdJRYtsNR8UYxZ3TnifXGjGc9eRYLq9sELwYpuuUu
```

## Executing a Transaction

Once the server is running, send a `POST` request to execute a swap transaction.

### Example Console Output for a Successful Transaction

```
Transaction request received
Requesting quote...
Quote received, Requesting swap transaction...
Swap transaction received, signing...
Swapping 0.00001 SOL for 7.075 TNSR
Transaction confirmed: https://solscan.io/tx/524dLu3rdF2aRTCVZp9NZfaFacvyNPGqLhri8EEk2vzUTcdBbiT7beKw85zaaZbapX4cLGsUwxJQAVscGsDTrp3u
Overall time: 229ms
```

### Example of an Error

If an invalid token is used, an error message will be displayed in red:

```diff
- Error getting quote: The token EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1 is not tradable
```

<br>

### 🔹 **Changes & Improvements**

1. **Added a new copy trading feature** (`March 6, 2025`).
2. **Speed and performance improvements**.
3. **(BETA)** **GraphQL Testing for Wallet Monitor**
4. **Reformatted for better readability and structure**.

## Reference & docs:

[Jupiter QUOTE API Reference](https://station.jup.ag/docs/api/quote) <br>
[Jupiter SWAP API Reference](https://station.jup.ag/docs/api/swap)<br>
[JitoLabs RPC docs](https://docs.jito.wtf/lowlatencytxnsend/#api)<br>
[WebSocket Method Reference](https://solana.com/docs/rpc/websocket)<br>
[GraphQL BitQuery Reference docs](https://docs.bitquery.io/docs/category/solana/)<br>
