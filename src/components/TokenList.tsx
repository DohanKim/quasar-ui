import useQuasarStore from '../stores/useQuasarStore'
import { Link } from 'react-router-dom'

const TokenList = () => {
  const leverageTokens = useQuasarStore((s) => s.quasarGroup?.leverageTokens)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup)

  return (
    <>
      <div>
        Token List
        {leverageTokens ? (
          leverageTokens.map((token) => {
            if (token.isEmpty()) {
              return null
            } else {
              return (
                <div key={token.mint.toString()}>
                  <Link to={`/tokens/${token.mint.toString()}`}>
                    {token.getBaseSymbol(mangoGroup.config)} x
                    {token.targetLeverage.toString()}
                  </Link>
                </div>
              )
            }
          })
        ) : (
          <div>Loading</div>
        )}
      </div>
    </>
  )
}

export default TokenList
