import './App.css'
import React, { useState } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { Program, Provider, web3 } from '@project-serum/anchor'
import idl from './idl.json'

import { getPhantomWallet } from '@solana/wallet-adapter-wallets'
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from '@solana/wallet-adapter-react'
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui'
import Header from './molecules/header'
import styled, { keyframes } from 'styled-components'
import Main from './main'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  getPhantomWallet(),
]

const { SystemProgram, Keypair } = web3
/* create an account  */
const baseAccount = Keypair.generate()
const opts: any = {
  preflightCommitment: 'processed',
}
const programID = new PublicKey(idl.metadata.address)

function App(): any {
  const [value, setValue] = useState(null)
  const wallet = useWallet()

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const network = WalletAdapterNetwork.Devnet
    const connection = new Connection(network, opts.preflightCommitment)

    const provider = new Provider(connection, wallet, opts.preflightCommitment)
    return provider
  }

  // async function createCounter() {
  //   const provider = await getProvider()
  //   /* create the program interface combining the idl, program ID, and provider */
  //   const program = new Program(idl, programID, provider)
  //   try {
  //     /* interact with the program via rpc */
  //     await program.rpc.create({
  //       accounts: {
  //         baseAccount: baseAccount.publicKey,
  //         user: provider.wallet.publicKey,
  //         systemProgram: SystemProgram.programId,
  //       },
  //       signers: [baseAccount],
  //     })

  //     const account = await program.account.baseAccount.fetch(
  //       baseAccount.publicKey,
  //     )
  //     console.log('account: ', account)
  //     setValue(account.count.toString())
  //   } catch (err) {
  //     console.log('Transaction error: ', err)
  //   }
  // }

  // async function increment() {
  //   const provider = await getProvider()
  //   const program = new Program(idl, programID, provider)
  //   await program.rpc.increment({
  //     accounts: {
  //       baseAccount: baseAccount.publicKey,
  //     },
  //   })

  //   const account = await program.account.baseAccount.fetch(
  //     baseAccount.publicKey,
  //   )
  //   console.log('account: ', account)
  //   setValue(account.count.toString())
  // }

  return (
    <Container>
      <Header isWalletConnected={wallet.connected} wallet={wallet} />
      <Main />
      <Animation>
        <Color1 />
        <Color2 />
        <Color3 />
      </Animation>
    </Container>
  )

  //   if (!wallet.connected) {
  //     /* If the user's wallet is not connected, display connect wallet button. */
  //     return (
  //       <div
  //         style={{
  //           display: 'flex',
  //           justifyContent: 'center',
  //           marginTop: '100px',
  //         }}
  //       >
  //         <WalletMultiButton />
  //       </div>
  //     )
  //   } else {
  //     return (
  //       <div className="App">
  //         <div>
  //           {!value && <button onClick={createCounter}>Create counter</button>}
  //           {value && <button onClick={increment}>Increment counter</button>}

  //           {value && value >= Number(0) ? (
  //             <h2>{value}</h2>
  //           ) : (
  //             <h3>Please create the counter.</h3>
  //           )}
  //         </div>
  //       </div>
  //     )
  //   }
}

/* wallet configuration as specified here: https://github.com/solana-labs/wallet-adapter#setup */
const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider

const Container = styled.div`
  background-color: black;
  position: relative;
`

const Rotate = keyframes`
  100% {
    transform: rotate(360deg);
  }
`

const AnimationWrapper = styled.div`
  display: block;
  position: relative;
`

const Animation = styled.div`
  position: absolute;
  width: 44%;
  //max-width: 44%;
  //min-height: 80%;
  top: 100px;
  right: -98px;
  height: 1000px;
  // transform: translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(0deg) rotateZ(30deg);
  animation: ${Rotate} 10s linear infinite;
  transform-style: preserve-3d;
  will-change: transform;
  opacity: 50%;
  filter: blur(100px);
  z-index: 1;
`

const Color1 = styled.div`
  position: absolute;
  top: -41px;
  right: -112px;
  z-index: 1;
  max-height: 70%;
  min-height: 70%;
  min-width: 70%;
  border-radius: 1000000px;
  background-color: #ff4848;
`

const Color2 = styled.div`
  position: absolute;
  right: 0px;
  bottom: 0px;
  width: 70%;
  max-height: 70%;
  min-height: 70%;
  min-width: 70%;
  border-radius: 1000000px;
  background-color: #e9cd4f;
`

const Color3 = styled.div`
  position: absolute;
  width: 70%;
  max-height: 70%;
  min-height: 70%;
  min-width: 70%;
  border-radius: 1000000px;
  background-color: #17ffc5;
`
