import { useEffect, useMemo } from 'react'
import useLocalStorageState from './useLocalStorageState'
import useQuasarStore from '../stores/useQuasarStore'
import {
    PhantomWalletAdapter,
} from '../utils/wallet-adapters'
import { WalletAdapter } from '../@types/types'
import { notify } from '../utils/notifications'

const SECONDS = 1000
const ASSET_URL =
    'https://cdn.jsdelivr.net/gh/solana-labs/oyster@main/assets/wallets'

export const WALLET_PROVIDERS = [
    {
        name: 'Phantom',
        url: 'https://www.phantom.app',
        icon: `https://www.phantom.app/img/logo.png`,
        adapter: PhantomWalletAdapter,
    },
]

export const PROVIDER_LOCAL_STORAGE_KEY = 'walletProvider-0.1'
export const DEFAULT_PROVIDER = WALLET_PROVIDERS[0]

export default function useWallet() {
    const setQuasarStore = useQuasarStore((state) => state.set)
    const {
        current: wallet,
        connected,
        providerUrl: selectedProviderUrl,
    } = useQuasarStore((state) => state.wallet)
    const endpoint = useQuasarStore((state) => state.connection.endpoint)
    const actions = useQuasarStore((s) => s.actions)
    const [savedProviderUrl, setSavedProviderUrl] = useLocalStorageState(
        PROVIDER_LOCAL_STORAGE_KEY,
        DEFAULT_PROVIDER.url
    )
    const provider = useMemo(
        () => WALLET_PROVIDERS.find(({ url }) => url === savedProviderUrl),
        [savedProviderUrl]
    )

    useEffect(() => {
        console.log("provider url changed: ", selectedProviderUrl);
        if (selectedProviderUrl) {
            setSavedProviderUrl(selectedProviderUrl)
        }
    }, [selectedProviderUrl])

    useEffect(() => {
        console.log("provider:", provider);
        if (provider) {
            const updateWallet = () => {
                // hack to also update wallet synchronously in case it disconnects
                // eslint-disable-next-line react-hooks/exhaustive-deps
                const wallet = (new provider.adapter) as WalletAdapter
                setQuasarStore((state) => {
                    state.wallet.current = wallet
                })
            }

            if (document.readyState !== 'complete') {
                // wait to ensure that browser extensions are loaded
                const listener = () => {
                    updateWallet()
                    window.removeEventListener('load', listener)
                }
                window.addEventListener('load', listener)
                return () => window.removeEventListener('load', listener)
            } else {
                updateWallet()
            }
        }
    }, [provider, savedProviderUrl, endpoint])

    useEffect(() => {
        if (!wallet) return
        wallet.on('connect', async () => {
            setQuasarStore((state) => {
                state.wallet.connected = true
            })
            notify({
                title: 'Wallet connected',
                description:
                    'Connected to wallet ' +
                    wallet.publicKey.toString().substr(0, 5) +
                    '...' +
                    wallet.publicKey.toString().substr(-5),
            })
        })
        wallet.on('disconnect', () => {
            console.log('disconnecting wallet')
            setQuasarStore((state) => {
                state.wallet.connected = false
            })
            notify({
                type: 'info',
                title: 'Disconnected from wallet',
            })
        })
        // return () => {
        //     if (wallet && wallet.connected) {
        //         console.log('DISCONNECTING')

        //         wallet.disconnect()
        //     }
        //     setQuasarStore((state) => {
        //         state.wallet.connected = false
        //     })
        // }
    }, [wallet, setQuasarStore])

    return { connected, wallet }
}
