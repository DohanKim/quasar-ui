import useQuasarStore from '../stores/useQuasarStore'

import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { I80F48 } from '@blockworks-foundation/mango-client'
import { mangoProgramId, mangoGroupPk } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'
import { useState } from 'react'

const AddLeverageTokenForm = () => {
  const quasarClient = useQuasarStore((s) => s.connection.client)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)

  const [baseTokenMint, setBaseTokenMint] = useState('')
  const [mangoPerpMarket, setMangoPerpMarket] = useState('')
  const [targetLeverage, setTargetLeverage] = useState('')

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const addLeverageToken = async () => {
    const wallet = useQuasarStore.getState().wallet.current
    console.log(targetLeverage)

    try {
      const leverageToken = await quasarClient.addLeverageToken(
        quasarGroup.publicKey,
        new PublicKey(baseTokenMint),
        new PublicKey(mangoProgramId),
        new PublicKey(mangoGroupPk),
        new PublicKey(mangoPerpMarket),
        wallet,
        quasarGroup.signerKey,
        new I80F48(new BN(targetLeverage)),
      )
      notify({
        title: 'leverage token added',
      })

      console.log(leverageToken.toString())
    } catch (err) {
      console.warn('Error adding leverage token:', err)
      notify({
        title: 'Could not add a leverage token',
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
          <label>mango perp market</label>
          <input
            className={`border`}
            type="text"
            name="mangoPerpMarket"
            value={mangoPerpMarket}
            onChange={handleTextChange(setMangoPerpMarket)}
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
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => addLeverageToken()}
        >
          add leverage token
        </button>
      </div>
    </>
  )
}

export default AddLeverageTokenForm
