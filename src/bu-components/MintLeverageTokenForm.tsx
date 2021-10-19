import useQuasarStore from '../stores/useQuasarStore'

import { Keypair, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { I80F48 } from '@blockworks-foundation/mango-client'
import { mangoProgramId } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'
import { useState } from 'react'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const MintLeverageTokenForm = (props) => {
  const tokenMint = props.tokenMint
  const quasarClient = useQuasarStore((s) => s.connection.client)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
  const connection = useQuasarStore((s) => s.connection.current)

  const [quantity, setQuantity] = useState('')

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const mintLeverageToken = async () => {
    const wallet = useQuasarStore.getState().wallet.current

    try {
      const tokenMintPk = new PublicKey(tokenMint)
      const quoteTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112',
      )
      const leverageTokenIndex =
        quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
      const quoteTokenIndex = mangoGroup.getTokenIndex(quoteTokenMint)

      const leverageToken = await quasarClient.mintLeverageToken(
        quasarGroup.publicKey,
        new PublicKey(tokenMint),
        mangoProgramId,
        mangoGroup.publicKey,
        quasarGroup.leverageTokens[leverageTokenIndex].mangoAccount,
        wallet,
        mangoGroup.mangoCache,
        mangoGroup.tokens[quoteTokenIndex].rootBank,
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBanks[0],
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBankAccounts[0].vault,
        quasarGroup.signerKey,
        new BN(quantity),
      )
      notify({
        title: 'leverage token minted',
      })

      console.log(leverageToken.toString())
    } catch (err) {
      console.warn('Error minting leverage token:', err)
      notify({
        title: 'Could not mint a leverage token',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  return (
    <>
      <div className="m-4">
        <div>
          <label>quantity</label>
          <input
            className={`border`}
            type="number"
            name="quantity"
            value={quantity}
            onChange={handleTextChange(setQuantity)}
          />
        </div>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => mintLeverageToken()}
        >
          mint leverage token
        </button>
      </div>
    </>
  )
}

export default MintLeverageTokenForm
