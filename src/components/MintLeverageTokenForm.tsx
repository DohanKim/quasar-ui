import useQuasarStore from '../stores/useQuasarStore'

import { PublicKey } from '@solana/web3.js'
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

const AddLeverageTokenForm = () => {
  const quasarClient = useQuasarStore((s) => s.connection.client)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)

  const [baseTokenMint, setBaseTokenMint] = useState('')
  const [targetLeverage, setTargetLeverage] = useState(0)
  const [quantity, setQuantity] = useState(0)

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const mintLeverageToken = async () => {
    const wallet = useQuasarStore.getState().wallet.current
    console.log(targetLeverage)

    try {
      const quoteTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112',
      )
      const leverageTokenIndex = quasarGroup.getLeverageTokenIndex(
        new PublicKey(baseTokenMint),
        new I80F48(new BN(targetLeverage)),
      )
      const quoteTokenIndex = mangoGroup.getTokenIndex(quoteTokenMint) // to deposit solana

      const leverageToken = await quasarClient.mintLeverageToken(
        quasarGroup.publicKey,
        new PublicKey(baseTokenMint),
        mangoProgramId,
        mangoGroup.publicKey,
        quasarGroup.leverageTokens[leverageTokenIndex].mangoAccount,
        wallet,
        mangoGroup.mangoCache,
        mangoGroup.tokens[quoteTokenIndex].rootBank,
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBanks[0],
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBankAccounts[0].vault,
        // wallet.publicKey,
        I80F48.fromNumber(targetLeverage),
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
          <label>base token mint</label>
          <input
            className={`border`}
            type="text"
            name="baseTokenMint"
            value={baseTokenMint}
            onChange={handleTextChange(setBaseTokenMint)}
          />
        </div>
        <div>
          <label>target leverage</label>
          <input
            className={`border`}
            type="number"
            name="targetLeverage"
            value={targetLeverage}
            onChange={handleTextChange(setTargetLeverage)}
          />
        </div>
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

export default AddLeverageTokenForm
