import create, { State } from 'zustand'
import produce from 'immer'
import IDS from '../ids.json'
import { Config, TokenConfig } from '../client/config'
import { TokenAccount } from '../token'
import QuasarGroup from '../client/QuasarGroup'
import { AccountInfo, Commitment, Connection, PublicKey } from '@solana/web3.js'
import { EndpointInfo, WalletAdapter } from '../@types/types'
import { QuasarClient } from '../client/client'
import {
  GroupConfig,
  MangoCache,
  MangoClient,
  MangoGroup,
  PerpMarket,
  getMarketByBaseSymbolAndKind,
  MarketConfig,
  PerpMarketLayout,
  getAllMarkets,
  getMultipleAccounts,
  getTokenAccountsByOwnerWithWrappedSol,
  getTokenByMint,
  nativeToUi,
} from '@blockworks-foundation/mango-client'
import { Market } from '@project-serum/serum'
import { notify } from '../utils/notifications'
import { zipDict } from '../utils'

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
]

type ClusterType = 'mainnet' | 'devnet'

const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER as ClusterType) || 'devnet'
const ENDPOINT = ENDPOINTS.find((e) => e.name === CLUSTER)

export const WEBSOCKET_CONNECTION = new Connection(
  ENDPOINT.websocket,
  'processed' as Commitment,
)

const DEFAULT_MANGO_GROUP_NAME = process.env.NEXT_PUBLIC_GROUP || 'devnet.2'
const DEFAULT_MANGO_GROUP_CONFIG = Config.ids().getGroup(
  CLUSTER,
  DEFAULT_MANGO_GROUP_NAME,
)
const defaultMangoGroupIds = IDS['groups'].find(
  (group) => group.name === DEFAULT_MANGO_GROUP_NAME,
)

export const programId = new PublicKey(defaultMangoGroupIds.quasarProgramId)
console.log('program ID', programId.toString())
export const quasarGroupPk = new PublicKey(defaultMangoGroupIds.quasarGroupPk)

export const mangoProgramId = new PublicKey(defaultMangoGroupIds.mangoProgramId)
export const serumProgramId = new PublicKey(defaultMangoGroupIds.serumProgramId)
export const mangoGroupPk = new PublicKey(defaultMangoGroupIds.publicKey)

export const INITIAL_STATE = {
  WALLET: {
    providerUrl: null,
    connected: false,
    current: null,
    tokens: [],
  },
}

// an object with keys of Solana account addresses that we are
// subscribing to with connection.onAccountChange() in the
// useHydrateStore hook
interface AccountInfoList {
  [key: string]: AccountInfo<Buffer>
}

export interface WalletToken {
  account: TokenAccount
  config: TokenConfig
  uiBalance: number
}

interface QuasarStore extends State {
  notifications: Array<{
    type: string
    title: string
    description?: string
    txid?: string
  }>
  accountInfos: AccountInfoList
  connection: {
    cluster: ClusterType
    current: Connection
    websocket: Connection
    client: QuasarClient
    mangoClient: MangoClient
    endpoint: string
    slot: number
  }
  quasarGroup: QuasarGroup
  selectedMangoGroup: {
    config: GroupConfig
    name: string
    current: MangoGroup | null
    markets: {
      [address: string]: Market | PerpMarket
    }
    cache: MangoCache | null
  }
  selectedMarket: {
    config: MarketConfig
    current: Market | PerpMarket | null
    markPrice: number
    kind: string
    askInfo: AccountInfo<Buffer> | null
    bidInfo: AccountInfo<Buffer> | null
    fills: any[]
  }
  wallet: {
    providerUrl: string
    connected: boolean
    current: WalletAdapter | null
    tokens: WalletToken[]
  }
  set: (x: any) => void
  actions: {
    [key: string]: (args?) => void
  }
}

const useQuasarStore = create<QuasarStore>((set, get) => {
  const rpcUrl = ENDPOINT.url
  console.log('rpc url', rpcUrl, ENDPOINT.url, rpcUrl === ENDPOINT.url)

  const connection = new Connection(rpcUrl, 'processed' as Commitment)
  return {
    notifications: [],
    accountInfos: {},
    connection: {
      cluster: CLUSTER,
      current: connection,
      websocket: WEBSOCKET_CONNECTION,
      client: new QuasarClient(connection, programId),
      mangoClient: new MangoClient(connection, mangoProgramId),
      endpoint: ENDPOINT.url,
      slot: 0,
    },
    quasarGroup: null,
    selectedMangoGroup: {
      config: DEFAULT_MANGO_GROUP_CONFIG,
      name: DEFAULT_MANGO_GROUP_NAME,
      current: null,
      markets: {},
      rootBanks: [],
      cache: null,
    },
    selectedMarket: {
      config: getMarketByBaseSymbolAndKind(
        DEFAULT_MANGO_GROUP_CONFIG,
        'SOL',
        'perp',
      ) as MarketConfig,
      kind: 'perp',
      current: null,
      markPrice: 0,
      askInfo: null,
      bidInfo: null,
      orderBook: { bids: [], asks: [] },
      fills: [],
    },
    wallet: INITIAL_STATE.WALLET,
    set: (fn) => set(produce(fn)),
    actions: {
      async fetchWalletTokens() {
        const groupConfig = get().selectedMangoGroup.config
        const wallet = get().wallet.current
        const connected = get().wallet.connected
        const connection = get().connection.current
        const set = get().set

        if (wallet?.publicKey && connected) {
          const ownedTokenAccounts =
            await getTokenAccountsByOwnerWithWrappedSol(
              connection,
              wallet.publicKey,
            )
          const tokens = []
          ownedTokenAccounts.forEach((account) => {
            const config = getTokenByMint(groupConfig, account.mint)
            if (config) {
              const uiBalance = nativeToUi(account.amount, config.decimals)
              tokens.push({ account, config, uiBalance })
            }
          })

          set((state) => {
            state.wallet.tokens = tokens
          })
        } else {
          set((state) => {
            state.wallet.tokens = []
          })
        }
      },
      async fetchQuasarGroup() {
        const set = get().set
        const client = get().connection.client

        return client
          .getQuasarGroup(quasarGroupPk)
          .then(async (quasarGroup) => {
            set((state) => {
              state.quasarGroup = quasarGroup
            })
          })
          .catch((err) => {
            notify({
              title: 'Could not get quasar group',
              description: `${err}`,
              type: 'error',
            })
            console.log('Could not get quasar group: ', err)
          })
      },
      async fetchAllMangoAccounts() {
        const set = get().set
        const mangoGroup = get().selectedMangoGroup.current
        const quasarPk = new PublicKey(
          '4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo',
        )

        if (!quasarPk) return
        return this.mangoClient
          .getMangoAccountsForOwner(mangoGroup, quasarPk, true)
          .then((mangoAccounts) => {
            if (mangoAccounts.length > 0) {
              const sortedAccounts = mangoAccounts
                .slice()
                .sort((a, b) =>
                  a.publicKey.toBase58() > b.publicKey.toBase58() ? 1 : -1,
                )

              set((state) => {
                state.selectedMangoAccount.initialLoad = false
                state.mangoAccounts = sortedAccounts
                if (!state.selectedMangoAccount.current) {
                  const lastAccount = localStorage.getItem(
                    'lastAccountViewed-3.0',
                  )
                  state.selectedMangoAccount.current =
                    mangoAccounts.find(
                      (ma) =>
                        ma.publicKey.toString() === JSON.parse(lastAccount),
                    ) || sortedAccounts[0]
                }
              })
            } else {
              set((state) => {
                state.selectedMangoAccount.initialLoad = false
              })
            }
          })
          .catch((err) => {
            notify({
              type: 'error',
              title: 'Unable to load mango account',
              description: err.message,
            })
            console.log('Could not get margin accounts for wallet', err)
          })
      },
      async fetchMangoGroup() {
        const set = get().set
        const mangoGroupConfig = get().selectedMangoGroup.config
        const mangoClient = get().connection.mangoClient
        const connection = get().connection.current

        return mangoClient
          .getMangoGroup(mangoGroupPk)
          .then(async (mangoGroup) => {
            const allMarketConfigs = getAllMarkets(mangoGroupConfig)
            const allMarketPks = allMarketConfigs.map((m) => m.publicKey)

            let allMarketAccountInfos, mangoCache
            try {
              const resp = await Promise.all([
                getMultipleAccounts(connection, allMarketPks),
                mangoGroup.loadCache(connection),
                mangoGroup.loadRootBanks(connection),
              ])
              allMarketAccountInfos = resp[0]
              mangoCache = resp[1]
            } catch {
              notify({
                type: 'error',
                title: 'Failed to load the mango group. Please refresh.',
              })
            }

            const allMarketAccounts = allMarketConfigs.map((config, i) => {
              if (config.kind == 'spot') {
                const decoded = Market.getLayout(programId).decode(
                  allMarketAccountInfos[i].accountInfo.data,
                )
                return new Market(
                  decoded,
                  config.baseDecimals,
                  config.quoteDecimals,
                  undefined,
                  mangoGroupConfig.serumProgramId,
                )
              }
              if (config.kind == 'perp') {
                const decoded = PerpMarketLayout.decode(
                  allMarketAccountInfos[i].accountInfo.data,
                )
                return new PerpMarket(
                  config.publicKey,
                  config.baseDecimals,
                  config.quoteDecimals,
                  decoded,
                )
              }
            })

            const allBidsAndAsksPks = allMarketConfigs
              .map((m) => [m.bidsKey, m.asksKey])
              .flat()
            const allBidsAndAsksAccountInfos = await getMultipleAccounts(
              connection,
              allBidsAndAsksPks,
            )

            const allMarkets = zipDict(
              allMarketPks.map((pk) => pk.toBase58()),
              allMarketAccounts,
            )

            set((state) => {
              state.selectedMangoGroup.current = mangoGroup
              state.selectedMangoGroup.cache = mangoCache
              state.selectedMangoGroup.markets = allMarkets

              allMarketAccountInfos
                .concat(allBidsAndAsksAccountInfos)
                .forEach(({ publicKey, context, accountInfo }) => {
                  if (context.slot >= state.connection.slot) {
                    state.connection.slot = context.slot
                    state.accountInfos[publicKey.toBase58()] = accountInfo
                  }
                })
            })
          })
          .catch((err) => {
            notify({
              title: 'Could not get mango group',
              description: `${err}`,
              type: 'error',
            })
            console.log('Could not get mango group: ', err)
          })
      },
    },
  }
})

export default useQuasarStore
