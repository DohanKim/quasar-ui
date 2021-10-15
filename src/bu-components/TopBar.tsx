import useQuasarStore from '../stores/useQuasarStore'
import ConnectWalletButton from './ConnectWalletButton'

const TopBar = () => {
    const connected = useQuasarStore((s) => s.wallet.connected)
    const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey)

    return (
        <>
            <nav className={`bg-th-bkg-2 border-b border-th-bkg-2`}>
                <div className={`pl-2 md:px-4 lg:px-10`}>
                    <div className={`flex justify-between h-14`}>
                        <div className="flex items-center">
                            <div className="flex">
                                <div className={`${connected ? 'pr-2 md:pr-0' : ''} pl-2`}>
                                    <ConnectWalletButton />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}

export default TopBar
