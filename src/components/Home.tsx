import useQuasarStore from '../stores/useQuasarStore'
import BurnLeverageTokenForm from './BurnLeverageTokenForm'
import MintLeverageTokenForm from './MintLeverageTokenForm'

const Home = () => {
  const connected = useQuasarStore((s) => s.wallet.connected)
  const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey)

  return (
    <>
      <div>
        Home
        <MintLeverageTokenForm />
        <BurnLeverageTokenForm />
      </div>
    </>
  )
}

export default Home
