import { Router, type Request, type Response } from "express";
import { walletManager } from "../services/wallet-manager.js";
import { v4 as uuidv4 } from "uuid";

export const walletRouter = Router();

// Create or get session wallet
walletRouter.post("/session", async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  const sid = sessionId || uuidv4();

  try {
    await walletManager.initialize();
    const sessionWallet = await walletManager.createSessionWallet(sid);
    const balance = await walletManager.getBalance(
      sessionWallet.wallet.walletId
    );

    res.json({
      sessionId: sid,
      wallet: {
        address: sessionWallet.wallet.address,
        blockchain: sessionWallet.wallet.blockchain,
        balance,
        explorerUrl: `https://testnet.arcscan.app/address/${sessionWallet.wallet.address}`,
      },
      isLive: walletManager.isLive(),
      treasury: {
        address: walletManager.getTreasuryAddress(),
        explorerUrl: `https://testnet.arcscan.app/address/${walletManager.getTreasuryAddress()}`,
      },
    });
  } catch (error) {
    console.error("[Wallet] Session creation failed:", error);
    res.status(500).json({ error: "Failed to create session wallet" });
  }
});

// Get wallet balance
walletRouter.get("/balance/:sessionId", async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const session = walletManager.getSessionWallet(sessionId);

  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  try {
    const balance = await walletManager.getBalance(session.wallet.walletId);
    res.json({
      address: session.wallet.address,
      balance,
      blockchain: session.wallet.blockchain,
      explorerUrl: `https://testnet.arcscan.app/address/${session.wallet.address}`,
    });
  } catch (error) {
    console.error("[Wallet] Balance check failed:", error);
    res.status(500).json({ error: "Failed to get balance" });
  }
});
