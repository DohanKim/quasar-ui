import useQuasarStore from '../stores/useQuasarStore'

import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { I80F48 } from '@blockworks-foundation/mango-client'
import { mangoProgramId, mangoGroupPk } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'
import { useState } from 'react'

const AddLeverageTokenForm = () => {
  const quasarClient = useQuasarStore((s) => s.connection.client)

  const [quasarGroup, setQuasarGroup] = useState('')
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
        new PublicKey(quasarGroup),
        new PublicKey(baseTokenMint),
        new PublicKey(mangoProgramId),
        new PublicKey(mangoGroupPk),
        new PublicKey(mangoPerpMarket),
        wallet,
        new I80F48(new BN(targetLeverage)),
      )
      notify({
        title: 'leverage token added',
      })

      console.log(leverageToken.toString())
      console.log(await quasarClient.getQuasarGroup(new PublicKey(quasarGroup)))
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
          <label>quasar group</label>
          <input
            className={`border`}
            type="text"
            name="quasarGroup"
            value={quasarGroup}
            onChange={handleTextChange(setQuasarGroup)}
          />
        </div>
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
        <button onClick={() => addLeverageToken()}>add leverage token</button>
      </div>
    </>
  )
}

export default AddLeverageTokenForm
