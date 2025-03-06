import WebSocket from "ws";

const token = "Your Bitquery API Key";

const WALLET = "Wallet adress to monitor"
const bitqueryConnection = new WebSocket(
  "wss://streaming.bitquery.io/eap?token=" + token,
  ["graphql-ws"]
);

bitqueryConnection.on("open", () => {
  console.log("Connected to Bitquery.");

  const initMessage = JSON.stringify({ type: "connection_init" });
  bitqueryConnection.send(initMessage);
});

bitqueryConnection.on("message", (data) => {
  const response = JSON.parse(data);

  if (response.type === "connection_ack") {
    console.log("Connection acknowledged by server.");

    const subscriptionMessage = JSON.stringify({
      type: "start",
      id: "1",
      payload: {
        query: `
        subscription {
  Solana {
    DEXTrades(
    where: {Transaction: {Signer: {is: "${WALLET}"}}},
    ) {
      Transaction {
        Signature
      }
      Block {
        Time
      }
      Trade {
        Buy {
          Amount
          Currency {
            Symbol
            Name
            MintAddress
          }
        }
        Sell {
          Amount
          Currency {
            Symbol
            Name
            MintAddress
          }
        }
        Dex {
          ProtocolName
          ProtocolFamily
        }
      }
    }
  }
}
        `,
      },
    });

    bitqueryConnection.send(subscriptionMessage);
    console.log("Subscription message sent.");

    //add stop logic
    setTimeout(() => {
      const stopMessage = JSON.stringify({ type: "stop", id: "1" });
      bitqueryConnection.send(stopMessage);
      console.log("Stop message sent after 10 seconds.");

      setTimeout(() => {
        console.log("Closing WebSocket connection.");
        bitqueryConnection.close();
      }, 1000);
    }, 10000);
  }

  if (response.type === "data") {
    console.log(response.payload.data.Solana.DEXTrades[0].Trade.Buy.Currency.MintAddress);
    console.log(response.payload.data.Solana.DEXTrades[0].Trade.Sell.Currency.MintAddress);
  }

  if (response.type === "ka") {
    console.log("Keep-alive message received.");
  }

  if (response.type === "error") {
    console.error("Error message received:", response.payload.errors);
  }
});

bitqueryConnection.on("close", () => {
  console.log("Disconnected from Bitquery.");
});

bitqueryConnection.on("error", (error) => {
  console.error("WebSocket Error:", error);
});