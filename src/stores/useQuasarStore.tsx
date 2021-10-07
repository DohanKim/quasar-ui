import create, { State } from 'zustand';
import produce from 'immer';
import IDS from '../ids.json';
import { Config, TokenConfig } from '../client/config';
import { TokenAccount } from '../token';
import {
  AccountInfo,
  Commitment,
  Connection,
  PublicKey,
} from '@solana/web3.js';
import { EndpointInfo, WalletAdapter } from '../@types/types';
import { QuasarClient } from '../client/client';

export const ENDPOINTS: EndpointInfo[] = [
  {
    name: 'mainnet',
    url: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    websocket: process.env.NEXT_PUBLIC_ENDPOINT || 'https://mango.rpcpool.com',
    custom: false,
  },
  {
    name: 'devnet',
    url: 'https://api.devnet.solana.com',
    websocket: 'https://api.devnet.solana.com',
    custom: false,
  },
];

type ClusterType = 'mainnet' | 'devnet';

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'devnet';
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER);

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment
);

const DEFAULT_MANGO_GROUP_NAME = process.env.NEXT_PUBLIC_GROUP || 'devnet.2';
const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME
);
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME
);

export const programId = new PublicKey(defaultMangoGroupIds.quasarProgramId);
console.log('program ID', programId.toString());

export const mangoProgramId = new PublicKey(
  defaultMangoGroupIds.mangoProgramId
);
export const serumProgramId = new PublicKey(
  defaultMangoGroupIds.serumProgramId
);
const mangoGroupPk = new PublicKey(defaultMangoGroupIds.publicKey);

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: [],
  },
};

// an object with keys of Solana account addresses that we are
// subscribing to with connection.onAccountChange() in the
// useHydrateStore hook
interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>;
}

export interface WalletToken {
  account: TokenAccount;
  config: TokenConfig;
  uiBalance: number;
}

interface QuasarStore extends State {
  notifications: Array<{
    type: string;
    title: string;
    description?: string;
    txid?: string;
  }>;
  accountInfos: AccountInfoList;
  connection: {
    cluster: ClusterType;
    current: Connection;
    websocket: Connection;
    client: QuasarClient;
    endpoint: string;
    slot: number;
  };
  wallet: {
    providerUrl: string;
    connected: boolean;
    current: WalletAdapter | null;
    tokens: WalletToken[];
  };
  set: (x: any) => void;
  actions: {
    [key: string]: (args?) => void;
  };
}

const useQuasarStore = create<QuasarStore>((set, get) => {
  const rpcUrl = ENDPOINT.url;
  console.log('rpc url', rpcUrl, ENDPOINT.url, rpcUrl === ENDPOINT.url);

  const connection = new Connection(rpcUrl, 'processed' as Commitment);
  return {
    notifications: [],
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: connection,
      websocket: WEBSOCKET_CONNECTION,
      client: new QuasarClient(connection, programId),
      endpoint: ENDPOINT.url,
      slot: 0,
    },
    wallet: INITIAL_STATE.WALLET,
    set: (fn) => set(produce(fn)),
    actions: {},
  };
});

export default useQuasarStore;
