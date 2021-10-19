import useQuasarStore, { serumProgramId } from '../stores/useQuasarStore'

import { Keypair, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  I80F48,
  MangoAccount,
  MangoClient,
} from '@blockworks-foundation/mango-client'
import { mangoProgramId } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'
import { useState } from 'react'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const BurnLeverageTokenForm = (props) => {
  const tokenMint = props.tokenMint
  const quasarClient = useQuasarStore((s) => s.connection.client)
  const mangoClient = useQuasarStore((s) => s.connection.mangoClient)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
  const connection = useQuasarStore((s) => s.connection.current)

  const [quantity, setQuantity] = useState('')

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const burnLeverageToken = async () => {
    const wallet = useQuasarStore.getState().wallet.current

    try {
      const tokenMintPk = new PublicKey(tokenMint)
      const quoteTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112',
      )
      const leverageTokenIndex =
        quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
      const quoteTokenIndex = mangoGroup.getTokenIndex(quoteTokenMint)
      const mangoAccountPk =
        quasarGroup.leverageTokens[leverageTokenIndex].mangoAccount

      const mangoAccount = await mangoClient.getMangoAccount(
        mangoAccountPk,
        serumProgramId,
      )

      const leverageToken = await quasarClient.burnLeverageToken(
        quasarGroup.publicKey,
        new PublicKey(tokenMint),
        new PublicKey('So11111111111111111111111111111111111111112'),
        mangoProgramId,
        mangoGroup.publicKey,
        mangoAccountPk,
        wallet,
        mangoGroup.mangoCache,
        mangoGroup.tokens[quoteTokenIndex].rootBank,
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBanks[0],
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBankAccounts[0].vault,
        quasarGroup.signerKey,
        mangoGroup.signerKey,
        mangoAccount.spotOpenOrders,

        new BN(quantity),
      )
      notify({
        title: 'leverage token burned',
      })

      console.log(leverageToken.toString())
    } catch (err) {
      console.warn('Error burning leverage token:', err)
      notify({
        title: 'Could not burn a leverage token',
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
          onClick={() => burnLeverageToken()}
        >
          burn leverage token
        </button>
      </div>
    </>
  )
}

export default BurnLeverageTokenForm
