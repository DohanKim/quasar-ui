import { AccountInfo, PublicKey, Transaction } from '@solana/web3.js';

export interface WalletAdapter {
  publicKey: PublicKey;
  autoApprove: boolean;
  connected: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
  connect: () => any;
  disconnect: () => any;
  on(event: string, fn: () => void): this;
}

export interface EndpointInfo {
  name: string;
  url: string;
  websocket: string;
  custom: boolean;
}

export const DEFAULT_PUBLIC_KEY = new PublicKey(
  '11111111111111111111111111111111'
);
