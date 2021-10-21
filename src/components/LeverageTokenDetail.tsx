import BurnLeverageTokenForm from './BurnLeverageTokenForm'
import MintLeverageTokenForm from './MintLeverageTokenForm'
import RebalanceForm from './RebalanceForm.tsx'
import LeverageTokenInfo from './LeverageTokenInfo'

const LeverageTokenDetail = ({ match }) => {
  const { tokenMint } = match.params

  return (
    <>
      <div>
        <LeverageTokenInfo tokenMint={tokenMint} />
        <MintLeverageTokenForm tokenMint={tokenMint} />
        <BurnLeverageTokenForm tokenMint={tokenMint} />
        <RebalanceForm tokenMint={tokenMint} />
      </div>
    </>
  )
}

export default LeverageTokenDetail
