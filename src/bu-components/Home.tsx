import BurnLeverageTokenForm from './BurnLeverageTokenForm'
import MintLeverageTokenForm from './MintLeverageTokenForm'
import RebalanceForm from './RebalanceForm.tsx'

const Home = () => {
  return (
    <>
      <div>
        Home
        <MintLeverageTokenForm />
        <BurnLeverageTokenForm />
        <RebalanceForm />
      </div>
    </>
  )
}

export default Home
