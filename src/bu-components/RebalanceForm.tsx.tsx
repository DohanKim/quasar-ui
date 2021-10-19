import useQuasarStore, { serumProgramId } from '../stores/useQuasarStore'

import { Keypair, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import {
  I80F48,
  MangoAccount,
  MangoClient,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { mangoProgramId } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'
import { useState } from 'react'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'

const RebalanceForm = (props) => {
  const tokenMint = props.tokenMint
  const quasarClient = useQuasarStore((s) => s.connection.client)
  const mangoClient = useQuasarStore((s) => s.connection.mangoClient)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
  const mangoMarkets = useQuasarStore((s) => s.selectedMangoGroup.markets)
  const connection = useQuasarStore((s) => s.connection.current)

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const rebalance = async () => {
    const wallet = useQuasarStore.getState().wallet.current

    try {
      const tokenMintPk = new PublicKey(tokenMint)
      const leverageTokenIndex =
        quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
      const leverageToken = quasarGroup.leverageTokens[leverageTokenIndex]
      const mangoAccountPk = leverageToken.mangoAccount

      const mangoAccount = await mangoClient.getMangoAccount(
        mangoAccountPk,
        serumProgramId,
      )

      const perpMarket = mangoMarkets[
        leverageToken.mangoPerpMarket.toBase58()
      ] as PerpMarket

      await quasarClient.rebalance(
        quasarGroup.publicKey,
        new PublicKey(tokenMint),
        quasarGroup.signerKey,
        mangoProgramId,
        mangoGroup.publicKey,
        mangoAccountPk,
        wallet,
        mangoGroup.mangoCache,
        perpMarket.publicKey,
        perpMarket.bids,
        perpMarket.asks,
        perpMarket.eventQueue,
        mangoAccount.spotOpenOrders,
      )
      notify({
        title: 'rebalanced token asset',
      })

      console.log(leverageToken.toString())
    } catch (err) {
      console.warn('Error rebalancing token asset:', err)
      notify({
        title: 'Could not rebalance the token asset',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  return (
    <>
      <div className="m-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => rebalance()}
        >
          rebalance
        </button>
      </div>
    </>
  )
}

export default RebalanceForm
