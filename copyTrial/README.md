# Copy Trading - SolanaBot

### **NOTE:**

The copy trading feature is currently in development. Contributions and improvements are welcome! Feel free to fork the repository and submit a pull request.

## 📌 Setup

In the root directory, there's a `.env.example` file containing the required values.

For **copy trading**, you must fill in the values under the section:

```sh
// FOR COPY TRADING
PRIVATE_KEY_2 = YOUR PRIVATE KEY THAT WILL COPY TRADE
SMART_WALLET = PUBLIC KEY OF THE WALLET TO COPY
RPC_URL = YOUR RPC ENDPOINT
WSS_URL = YOUR WEBSOCKET ENDPOINT
```

and then rename the file from `.env.example` to `.env` (remove `example` from the filename).

---

## ⚡ How Copy Trading Works

The copy trading feature allows the bot to **mirror trades** from the target wallet in real-time.

### 🛠️ Process:

1. **WebSocket Subscription**: The bot listens for activity using **logsSubscribe**.
2. **Detecting Activity**: When the target wallet makes a transaction, the bot extracts the **signature** from the notification log.
3. **Fetching Transaction Details**:
   - The bot calls a function that takes the signature and fetches the **full transaction details**.
   - It then analyzes the transaction to determine **whether it was a buy or sell** by comparing values and balance changes.
   - The bot extracts **token mint** and **SOL mint** from the transaction into variables.
4. **Executing the Trade**:
   - The bot calls `executeSwap(tokenMint, solMint, amount)` to copy the trade.
   - The function **returns a Solscan transaction link** confirming the execution.
5. **Speed Timer**:
   - A timer runs to **measure the total execution time** from detection to swap completion.

---

## 🚀 Next Steps

Once you have set up your `.env` file start the bot:

```sh
node copyTrial/listener.js
```

it will automatically track and execute trades from the target wallet in real-time when the target wallet makes a swap!
