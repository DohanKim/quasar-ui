import useQuasarStore from '../stores/useQuasarStore'
import ConnectWalletButton from './ConnectWalletButton'

import { AccountLayout, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  Account,
  Connection,
  Commitment,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import BN from 'bn.js'
import {
  Cluster,
  Config,
  MangoClient,
  sleep,
  MangoAccountLayout,
} from '@blockworks-foundation/mango-client'
import configFile from '../ids.json'
import { mangoProgramId } from '../stores/useQuasarStore'
import { notify } from '../utils/notifications'
import { useState } from 'react'

const Admin = () => {
  const connected = useQuasarStore((s) => s.wallet.connected)
  const publicKey = useQuasarStore((s) => s.wallet.current?.publicKey)

  const quasarClient = useQuasarStore((s) => s.connection.client)

  const [quasarGroup, setQuasarGroup] = useState('')
  const [mint, setMint] = useState('')
  const [oracle, setOracle] = useState('')

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const initQuasarGroup = async () => {
    const wallet = useQuasarStore.getState().wallet.current

    try {
      const quasarGroupPk = await quasarClient.initQuasarGroup(
        mangoProgramId,
        wallet
      )
      notify({
        title: 'quasar group initialized',
      })

      console.log(await quasarClient.getQuasarGroup(quasarGroupPk))
      console.log(quasarGroupPk.toString())
    } catch (err) {
      console.warn('Error initializing quasar group:', err)
      notify({
        title: 'Could not initialize quasar group',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  const addBaseToken = async () => {
    const wallet = useQuasarStore.getState().wallet.current

    try {
      console.log(quasarGroup)
      console.log(mint)
      await quasarClient.addBaseToken(
        new PublicKey(quasarGroup),
        new PublicKey(mint),
        new PublicKey(oracle),
        wallet
      )
      notify({
        title: 'base token added',
      })

      console.log(await quasarClient.getQuasarGroup(new PublicKey(quasarGroup)))
    } catch (err) {
      console.warn('Error adding base token:', err)
      notify({
        title: 'Could not add a base token',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  return (
    <>
      <div>
        Admin page
        <div className="m-4">
          <button onClick={() => initQuasarGroup()}>init quasar group</button>
        </div>
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
            <label>token mint</label>
            <input
              className={`border`}
              type="text"
              name="mint"
              value={mint}
              onChange={handleTextChange(setMint)}
            />
          </div>
          <div>
            <label>oracle</label>
            <input
              className={`border`}
              type="text"
              name="oracle"
              value={oracle}
              onChange={handleTextChange(setOracle)}
            />
          </div>
          <button onClick={() => addBaseToken()}>add base token</button>
        </div>
      </div>
    </>
  )
}

export default Admin
