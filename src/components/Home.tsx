import useQuasarStore from '../stores/useQuasarStore'
import MintLeverageTokenForm from './MintLeverageTokenForm'

const Home = () => {
  const connected = useQuasarStore((s) => s.wallet.connected)
  const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey)

  return (
    <>
      <div>
        Home
        <MintLeverageTokenForm />
      </div>
    </>
  )
}

export default Home
