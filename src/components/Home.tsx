import useQuasarStore from '../stores/useQuasarStore'
import ConnectWalletButton from './ConnectWalletButton'

const Home = () => {
    const connected = useQuasarStore((s) => s.wallet.connected)
    const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey)

    return (
        <>
            <div>
                Home
            </div>
        </>
    )
}

export default Home
