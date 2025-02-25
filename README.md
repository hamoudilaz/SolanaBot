# 🚀 Solana Trading Bot (Work in Progress)

This bot is still under development, but the **buy process is fully implemented!** 🎉

After spending **three days** researching and testing, I’ve successfully figured out how the system works and implemented the **most important instruction,** executing buy orders smoothly with priofee and jitotip.

## ✨ What Makes This Bot Special?

**this one allows you to set both `jitoTip` and `prioFee` at the same time.** <br>
**Its open source! Ive built this project as my hobby because i enjoy the process of learning and developing** <br>
**This means that no extra fee of 1% is charged like other services have.** <br>
**You dont need coding knowledge as all function logic and swap execution is already built by me.**

### 🤔 isn’t that already supported by Jupiters swap API?

No, Even though Jupiters **API documentation** claims you can set both priofee and jitotip using `prioritizationFeeLamports`, that **does not work.**

- **The truth:** Jupiters Swap API **only accepts one**—either `prioFee` or `jitoTip`.
- **Even `/swap-instructions` does not allow both**—I confirmed this directly with Jupiters support.
- **So how does this bot do it?** I found a workaround that lets both fees work together by manually decoding and adding the prioFee instruction into the transaction which solved the issue!

## Getting Started

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
3. Create `.env` file root directory and add:
   ```
   PRIVATE_KEY=your-wallet-private-key
   ```
4. Run the bot:
   ```sh
   npm start
   ```

## How to Use

### Step 1: Add Your Private Key

Create a `.env` file and add your private key:  
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

Navigate to solana.js
Load the private key from the `.env` file:

```js
const privateKey = process.env.PRIVATE_KEY;

const wallet = Keypair.fromSecretKey(bs58.decode(privateKey));

const userPublicKey = wallet.publicKey.toBase58();

console.log("Your PublicKey:" + userPublicKey); // Should return your wallet adress. If not recheck Step 1 and step 3 on "Getting started"
```

### Step 4: RPC Connection

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

> If you want to use your own RPC without sending the transaction to jito navigate to **src/solana.js**.
> Use this command to run solana.js:

```sh
   node src/solana.js
```

## 🔧 Next Steps

This bot is still being developed, so expect improvements and new features soon.

Next commit will probably be a simple web interface with options panel and possibly sell option.
