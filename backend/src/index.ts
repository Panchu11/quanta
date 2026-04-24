import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server as SocketServer } from "socket.io";
import { queryRouter } from "./routes/query.js";
import { walletRouter } from "./routes/wallet.js";
import { transactionRouter } from "./routes/transactions.js";
import { EventBus } from "./services/event-bus.js";

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// Global event bus for real-time updates
export const eventBus = new EventBus(io);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "quanta-backend",
    chain: "Arc Testnet",
    chainId: 5042002,
  });
});

// Routes
app.use("/api/query", queryRouter);
app.use("/api/wallet", walletRouter);
app.use("/api/transactions", transactionRouter);

// WebSocket connection
io.on("connection", (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(process.env.PORT || "4021", 10);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     QUANTA — Pay-Per-Insight Engine      ║
  ║                                          ║
  ║  API:    http://localhost:${PORT}           ║
  ║  Chain:  Arc Testnet (5042002)           ║
  ║  Gas:    USDC (native)                   ║
  ╚══════════════════════════════════════════╝
  `);
});

// Export for Vercel serverless
export default app;
export { io };
