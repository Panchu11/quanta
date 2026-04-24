import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";
import { v4 as uuidv4 } from "uuid";

interface WalletInfo {
  walletId: string;
  address: string;
  blockchain: string;
}

interface SessionWallet {
  sessionId: string;
  wallet: WalletInfo;
  createdAt: string;
}

class WalletManager {
  private client: ReturnType<typeof initiateDeveloperControlledWalletsClient> | null = null;
  private walletSetId: string | null = null;
  private sessionWallets: Map<string, SessionWallet> = new Map();
  private treasuryWallet: WalletInfo | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      console.warn("[Wallet] Missing CIRCLE_API_KEY or ENTITY_SECRET — simulation mode");
      this.initialized = true;
      return;
    }

    try {
      this.client = initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
      });

      const walletSetResponse = await this.client.createWalletSet({
        name: `quanta-${Date.now()}`,
      });

      this.walletSetId = walletSetResponse.data?.walletSet?.id || null;

      if (this.walletSetId) {
        const treasuryResponse = await this.client.createWallets({
          blockchains: ["ARC-TESTNET" as const],
          count: 1,
          walletSetId: this.walletSetId,
        });

        const wallets = treasuryResponse.data?.wallets;
        if (wallets && wallets.length > 0) {
          this.treasuryWallet = {
            walletId: wallets[0].id,
            address: wallets[0].address || "",
            blockchain: wallets[0].blockchain || "ARC-TESTNET",
          };
          console.log(`[Wallet] Treasury wallet: ${this.treasuryWallet.address}`);
        }
      }

      this.initialized = true;
      console.log("[Wallet] Circle wallet manager initialized");
    } catch (error) {
      console.error("[Wallet] Init failed:", error);
      console.warn("[Wallet] Falling back to simulation mode");
      this.initialized = true;
    }
  }

  isLive(): boolean {
    return this.client !== null && this.walletSetId !== null;
  }

  async createSessionWallet(sessionId: string): Promise<SessionWallet> {
    const existing = this.sessionWallets.get(sessionId);
    if (existing) return existing;

    if (this.client && this.walletSetId) {
      try {
        const response = await this.client.createWallets({
          blockchains: ["ARC-TESTNET" as const],
          count: 1,
          walletSetId: this.walletSetId,
        });

        const wallets = response.data?.wallets;
        if (wallets && wallets.length > 0) {
          const sw: SessionWallet = {
            sessionId,
            wallet: {
              walletId: wallets[0].id,
              address: wallets[0].address || "",
              blockchain: wallets[0].blockchain || "ARC-TESTNET",
            },
            createdAt: new Date().toISOString(),
          };
          this.sessionWallets.set(sessionId, sw);
          console.log(`[Wallet] Session wallet: ${sw.wallet.address}`);
          return sw;
        }
      } catch (error) {
        console.error("[Wallet] Session wallet creation failed:", error);
      }
    }

    // Simulation mode
    const simWallet: SessionWallet = {
      sessionId,
      wallet: {
        walletId: `sim-${uuidv4()}`,
        address: `0x${uuidv4().replace(/-/g, "").slice(0, 40)}`,
        blockchain: "ARC-TESTNET",
      },
      createdAt: new Date().toISOString(),
    };
    this.sessionWallets.set(sessionId, simWallet);
    return simWallet;
  }

  async getBalance(walletId: string): Promise<number> {
    if (this.client) {
      try {
        const response = await this.client.getWalletTokenBalance({ id: walletId });
        const balances = response.data?.tokenBalances;
        if (balances) {
          const usdc = balances.find((t) => t.token.symbol === "USDC");
          if (usdc) return parseFloat(usdc.amount);
        }
      } catch (error) {
        console.error("[Wallet] Balance check failed:", error);
      }
    }
    return 100.0; // Simulation balance
  }

  async transferUSDC(
    fromWalletId: string,
    toAddress: string,
    amount: string,
    tokenId?: string
  ): Promise<{ txId: string; status: string; hash?: string }> {
    if (this.client) {
      try {
        const response = await this.client.createTransaction({
          walletId: fromWalletId,
          amount: [amount],
          destinationAddress: toAddress,
          tokenId: tokenId || "",
          fee: { type: "level", config: { feeLevel: "HIGH" } },
        });

        const txId = (response.data as unknown as Record<string, string>)?.id ?? uuidv4();
        return { txId, status: "PENDING" };
      } catch (error) {
        console.error("[Wallet] Transfer failed:", error);
      }
    }

    return {
      txId: `sim-tx-${uuidv4().slice(0, 8)}`,
      status: "CONFIRMED",
      hash: `0x${uuidv4().replace(/-/g, "")}`,
    };
  }

  getSessionWallet(sessionId: string): SessionWallet | undefined {
    return this.sessionWallets.get(sessionId);
  }

  getTreasuryAddress(): string {
    return this.treasuryWallet?.address || "0x0000000000000000000000000000000000000000";
  }

  getTreasuryWalletId(): string {
    return this.treasuryWallet?.walletId || "sim-treasury";
  }
}

export const walletManager = new WalletManager();
