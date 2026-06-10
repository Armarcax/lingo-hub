/**
 * Future blockchain readiness — stub layer.
 * Today everything is off-chain via wallet.ts. Tomorrow these interfaces
 * can be backed by Ethereum/Polygon/Solana without changing learning code.
 */
import { wallet } from "./wallet";

export interface WalletConnector {
  isConnected(): boolean;
  connect(): Promise<{ address: string }>;
  disconnect(): Promise<void>;
  address(): string | null;
}

export interface TokenService {
  symbol: string;
  decimals: number;
  totalSupply(): Promise<bigint>;
}

export interface BalanceService {
  balanceOf(address: string | null): Promise<number>;
}

export interface TransactionService {
  transfer(to: string, amount: number, memo?: string): Promise<{ txId: string }>;
}

// ─── Off-chain reference implementations ────────────────────────────────────

export const offchainWalletConnector: WalletConnector = {
  isConnected: () => true,
  async connect() { return { address: "offchain:self" }; },
  async disconnect() {},
  address: () => "offchain:self",
};

export const hayqTokenService: TokenService = {
  symbol: "HAYQ",
  decimals: 0,
  async totalSupply() { return BigInt(0); },
};

export const offchainBalanceService: BalanceService = {
  async balanceOf() { return wallet.balance(); },
};

export const offchainTransactionService: TransactionService = {
  async transfer(_to, amount, memo) {
    wallet.debit(amount, "transfer", { memo });
    return { txId: `local_${Date.now()}` };
  },
};
