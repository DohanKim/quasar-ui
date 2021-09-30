import { useState } from 'react'
import useQuasarStore from '../stores/useQuasarStore'
import {
    LogoutIcon,
} from '@heroicons/react/outline'
import {
    WALLET_PROVIDERS,
    DEFAULT_PROVIDER,
    PROVIDER_LOCAL_STORAGE_KEY,
} from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { abbreviateAddress, copyToClipboard } from '../utils'
import WalletSelect from './WalletSelect'
import { useEffect } from 'react'

const ConnectWalletButton = () => {
    const wallet = useQuasarStore((s) => s.wallet.current)
    const connected = useQuasarStore((s) => s.wallet.connected)
    const set = useQuasarStore((s) => s.set)
    const [selectedWallet, setSelectedWallet] = useState(DEFAULT_PROVIDER.url)
    const [savedProviderUrl] = useLocalStorageState(
        PROVIDER_LOCAL_STORAGE_KEY,
        DEFAULT_PROVIDER.url
    )

    useEffect(() => {
        setSelectedWallet(savedProviderUrl)
    }, [savedProviderUrl])

    const handleWalletConect = () => {
        wallet.connect()
    }

    // console.log(wallet.publicKey.toString())

    return (
        <>
            {connected && wallet?.publicKey ? (
                <div className="bg-th-bkg-1 h-14 flex divide-x divide-th-bkg-3 justify-between">
                    <button
                        className="rounded-none text-th-primary hover:bg-th-bkg-4 focus:outline-none disabled:text-th-fgd-4 disabled:cursor-wait" onClick={() => wallet.disconnect()}
                    >
                        <LogoutIcon className="h-4 w-4" />
                        <div className="pl-2 text-left">
                            <div className="pb-0.5">Disconnect</div>
                            <div className="text-th-fgd-4 text-xs">
                                {abbreviateAddress(wallet?.publicKey)}
                            </div>
                        </div>
                    </button>
                </div>
            ) : (
                <div className="bg-th-bkg-1 h-14 flex divide-x divide-th-bkg-3 justify-between">
                    <button
                        onClick={handleWalletConect}
                        disabled={!wallet}
                        className="rounded-none text-th-primary hover:bg-th-bkg-4 focus:outline-none disabled:text-th-fgd-4 disabled:cursor-wait"
                    >
                        <div className="flex flex-row items-center px-3 justify-center h-full default-transition hover:text-th-fgd-1">
                            <div>
                                <div className="mb-0.5 whitespace-nowrap">Connect</div>
                                <div className="font-normal text-th-fgd-3 text-left leading-3 tracking-wider text-xxs">
                                    {WALLET_PROVIDERS.find((p) => p.url === selectedWallet)?.name}
                                </div>
                            </div>
                        </div>
                    </button>
                    <div className="relative">
                        <WalletSelect isPrimary />
                    </div>
                </div>
            )}
        </>
    )
}

export default ConnectWalletButton
