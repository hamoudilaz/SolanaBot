import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import Fastify from "fastify";
import dotenv from "dotenv";

dotenv.config();

const fastify = Fastify({ logger: false });

fastify.get("/", async (request, reply) => {
  return { message: "Server is running" };
});

console.log("Private Key Loaded:", process.env.PRIVATE_KEY);
console.log("RPC URL:", process.env.RPC_URL);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
    console.log("🚀 Server running on http://localhost:3000");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
