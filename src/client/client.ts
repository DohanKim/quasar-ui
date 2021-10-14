import {
  Account,
  AccountInfo,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  TransactionConfirmationStatus,
  TransactionSignature,
  SYSVAR_RENT_PUBKEY,
  Keypair,
} from '@solana/web3.js'
import BN from 'bn.js'
import {
  awaitTransactionSignatureConfirmation,
  createAccountInstruction,
  createSignerKeyAndNonce,
  createTokenAccountInstructions,
  simulateTransaction,
  sleep,
  zeroKey,
  ZERO_BN,
} from './utils'
import { QuasarGroupLayout, StubOracleLayout } from './layout'
import {
  makeInitQuasarGroupInstruction,
  makeAddBaseTokenInstruction,
  makeAddLeverageTokenInstruction,
  makeMintLeverageTokenInstruction,
  makeBurnLeverageTokenInstruction,
} from './instruction'
import {
  I80F48,
  makeWithdrawInstruction,
  MangoAccountLayout,
} from '@blockworks-foundation/mango-client'

import { WalletAdapter } from '../@types/types'
import {
  closeAccount,
  initializeAccount,
  WRAPPED_SOL_MINT,
} from '@project-serum/serum/lib/token-instructions'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import QuasarGroup from './QuasarGroup'

export const getUnixTs = () => {
  return new Date().getTime() / 1000
}

export class QuasarClient {
  connection: Connection
  programId: PublicKey

  constructor(connection: Connection, programId: PublicKey) {
    this.connection = connection
    this.programId = programId
  }

  async sendTransactions(
    transactions: Transaction[],
    payer: Account | WalletAdapter,
    additionalSigners: Account[],
    timeout = 30000,
    confirmLevel: TransactionConfirmationStatus = 'confirmed',
  ): Promise<TransactionSignature[]> {
    return await Promise.all(
      transactions.map((tx) =>
        this.sendTransaction(
          tx,
          payer,
          additionalSigners,
          timeout,
          confirmLevel,
        ),
      ),
    )
  }

  async signTransaction({ transaction, payer, signers }) {
    transaction.recentBlockhash = (
      await this.connection.getRecentBlockhash()
    ).blockhash
    transaction.setSigners(payer.publicKey, ...signers.map((s) => s.publicKey))
    if (signers.length > 0) {
      transaction.partialSign(...signers)
    }

    if (payer?.connected) {
      console.log('signing as wallet', payer.publicKey)
      return await payer.signTransaction(transaction)
    } else {
      transaction.sign(...[payer].concat(signers))
    }
  }

  async signTransactions({
    transactionsAndSigners,
    payer,
  }: {
    transactionsAndSigners: {
      transaction: Transaction
      signers?: Array<Account>
    }[]
    payer: Account | WalletAdapter
  }) {
    const blockhash = (await this.connection.getRecentBlockhash('max'))
      .blockhash
    transactionsAndSigners.forEach(({ transaction, signers = [] }) => {
      transaction.recentBlockhash = blockhash
      transaction.setSigners(
        payer.publicKey,
        ...signers.map((s) => s.publicKey),
      )
      if (signers?.length > 0) {
        transaction.partialSign(...signers)
      }
    })
    if (!(payer instanceof Account)) {
      return await payer.signAllTransactions(
        transactionsAndSigners.map(({ transaction }) => transaction),
      )
    } else {
      transactionsAndSigners.forEach(({ transaction, signers }) => {
        transaction.sign(...[payer].concat(signers))
      })
    }
  }

  // TODO - switch Account to Keypair and switch off setSigners due to deprecated
  async sendTransaction(
    transaction: Transaction,
    payer: Account | WalletAdapter,
    additionalSigners: Account[],
    timeout = 30000,
    confirmLevel: TransactionConfirmationStatus = 'processed',
    postSignTxCallback?: any,
  ): Promise<TransactionSignature> {
    await this.signTransaction({
      transaction,
      payer,
      signers: additionalSigners,
    })

    const rawTransaction = transaction.serialize()
    const startTime = getUnixTs()
    if (postSignTxCallback) {
      try {
        postSignTxCallback()
      } catch (e) {
        console.log(`postSignTxCallback error ${e}`)
      }
    }
    const txid: TransactionSignature = await this.connection.sendRawTransaction(
      rawTransaction,
      { skipPreflight: true },
    )

    console.log(
      'Started awaiting confirmation for',
      txid,
      'size:',
      rawTransaction.length,
    )

    let done = false
    ;(async () => {
      // TODO - make sure this works well on mainnet
      await sleep(1000)
      while (!done && getUnixTs() - startTime < timeout / 1000) {
        console.log(new Date().toUTCString(), ' sending tx ', txid)
        this.connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        })
        await sleep(2000)
      }
    })()

    try {
      await awaitTransactionSignatureConfirmation(
        txid,
        timeout,
        this.connection,
        confirmLevel,
      )
    } catch (err) {
      if (err.timeout) {
        throw new Error('Timed out awaiting confirmation on transaction')
      }
      let simulateResult: SimulatedTransactionResponse | null = null
      try {
        simulateResult = (
          await simulateTransaction(this.connection, transaction, 'processed')
        ).value
      } catch (e) {
        console.warn('Simulate transaction failed')
      }

      if (simulateResult && simulateResult.err) {
        if (simulateResult.logs) {
          for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
            const line = simulateResult.logs[i]
            if (line.startsWith('Program log: ')) {
              throw new Error(
                'Transaction failed: ' + line.slice('Program log: '.length),
              )
            }
          }
        }
        throw new Error(JSON.stringify(simulateResult.err))
      }
      throw new Error('Transaction failed')
    } finally {
      done = true
    }

    // console.log('Latency', txid, getUnixTs() - startTime);
    return txid
  }

  async sendSignedTransaction({
    signedTransaction,
    timeout = 30000,
    confirmLevel = 'processed',
  }: {
    signedTransaction: Transaction
    timeout?: number
    confirmLevel?: TransactionConfirmationStatus
  }): Promise<string> {
    const rawTransaction = signedTransaction.serialize()
    const startTime = getUnixTs()

    const txid: TransactionSignature = await this.connection.sendRawTransaction(
      rawTransaction,
      {
        skipPreflight: true,
      },
    )

    // console.log('Started awaiting confirmation for', txid);

    let done = false
    ;(async () => {
      await sleep(500)
      while (!done && getUnixTs() - startTime < timeout) {
        this.connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        })
        await sleep(500)
      }
    })()
    try {
      await awaitTransactionSignatureConfirmation(
        txid,
        timeout,
        this.connection,
        confirmLevel,
      )
    } catch (err) {
      if (err.timeout) {
        throw new Error('Timed out awaiting confirmation on transaction')
      }
      let simulateResult: SimulatedTransactionResponse | null = null
      try {
        simulateResult = (
          await simulateTransaction(
            this.connection,
            signedTransaction,
            'single',
          )
        ).value
      } catch (e) {
        console.log('Simulate tx failed')
      }
      if (simulateResult && simulateResult.err) {
        if (simulateResult.logs) {
          for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
            const line = simulateResult.logs[i]
            if (line.startsWith('Program log: ')) {
              throw new Error(
                'Transaction failed: ' + line.slice('Program log: '.length),
              )
            }
          }
        }
        throw new Error(JSON.stringify(simulateResult.err))
      }
      throw new Error('Transaction failed')
    } finally {
      done = true
    }

    // console.log('Latency', txid, getUnixTs() - startTime);
    return txid
  }

  async initQuasarGroup(
    mangoProgram: PublicKey,
    payer: Account | WalletAdapter,
  ): Promise<PublicKey> {
    const accountInstruction = await createAccountInstruction(
      this.connection,
      payer.publicKey,
      QuasarGroupLayout.span,
      this.programId,
    )
    const { signerKey, signerNonce } = await createSignerKeyAndNonce(
      this.programId,
      accountInstruction.keypair.publicKey,
    )

    const createAccountsTransaction = new Transaction()
    createAccountsTransaction.add(accountInstruction.instruction)

    const signers = [new Account(accountInstruction.keypair.secretKey)]
    await this.sendTransaction(createAccountsTransaction, payer, signers)

    const initQuasarGroupInstruction = makeInitQuasarGroupInstruction(
      this.programId,
      accountInstruction.keypair.publicKey,
      signerKey,
      payer.publicKey,
      mangoProgram,
      new BN(signerNonce),
    )

    const initQuasarGroupTransaction = new Transaction()
    initQuasarGroupTransaction.add(initQuasarGroupInstruction)
    await this.sendTransaction(initQuasarGroupTransaction, payer, [])

    return accountInstruction.keypair.publicKey
  }

  async getQuasarGroup(quasarGroup: PublicKey): Promise<QuasarGroup> {
    const accountInfo = await this.connection.getAccountInfo(quasarGroup)
    const decoded = QuasarGroupLayout.decode(
      accountInfo == null ? undefined : accountInfo.data,
    )

    return new QuasarGroup(quasarGroup, decoded)
  }

  async addBaseToken(
    quasarGroupPk: PublicKey,
    mintPk: PublicKey,
    oraclePk: PublicKey,
    admin: Account | WalletAdapter,
  ): Promise<TransactionSignature> {
    const addBaseTokenInstruction = makeAddBaseTokenInstruction(
      this.programId,
      quasarGroupPk,
      mintPk,
      oraclePk,
      admin.publicKey,
    )

    const addBaseTokenTransaction = new Transaction()
    addBaseTokenTransaction.add(addBaseTokenInstruction)
    return await this.sendTransaction(addBaseTokenTransaction, admin, [])
  }

  async addLeverageToken(
    quasarGroupPk: PublicKey,
    baseTokenMintPk: PublicKey,
    mangoProgram: PublicKey,
    mangoGroup: PublicKey,
    mangoPerpMarket: PublicKey,
    admin: Account | WalletAdapter,
    pda: PublicKey,
    targetLeverage: I80F48,
  ): Promise<PublicKey> {
    const mintKeypair = new Keypair()

    const mangoAccountInstruction = await createAccountInstruction(
      this.connection,
      admin.publicKey,
      MangoAccountLayout.span,
      mangoProgram,
    )
    console.log(mangoAccountInstruction.keypair.publicKey.toString())

    const addLeverageTokenInstruction = makeAddLeverageTokenInstruction(
      this.programId,
      quasarGroupPk,
      mintKeypair.publicKey,
      baseTokenMintPk,
      mangoProgram,
      mangoGroup,
      mangoAccountInstruction.keypair.publicKey,
      mangoPerpMarket,
      admin.publicKey,
      pda,
      targetLeverage,
    )

    const addLeverageTokenTransaction = new Transaction()
    addLeverageTokenTransaction.add(
      mangoAccountInstruction.instruction,
      addLeverageTokenInstruction,
    )

    const signers = [
      new Account(mangoAccountInstruction.keypair.secretKey),
      new Account(mintKeypair.secretKey),
    ]
    await this.sendTransaction(addLeverageTokenTransaction, admin, signers)

    return mintKeypair.publicKey
  }

  async mintLeverageToken(
    quasarGroupPk: PublicKey,
    tokenMintPk: PublicKey,
    mangoProgram: PublicKey,
    mangoGroupPk: PublicKey,
    mangoAccountPk: PublicKey,
    owner: Account | WalletAdapter,
    mangoCachePk: PublicKey,
    mangoRootBankPk: PublicKey,
    mangoNodeBankPk: PublicKey,
    mangoVaultPk: PublicKey,
    pda: PublicKey,
    quantity: BN,
  ): Promise<TransactionSignature> {
    const transaction = new Transaction()

    let wrappedSolAccount: Account | null = null
    wrappedSolAccount = new Account()
    const lamports = Math.round(quantity.toNumber() * LAMPORTS_PER_SOL) + 1e7
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: owner.publicKey,
        newAccountPubkey: wrappedSolAccount.publicKey,
        lamports,
        space: 165,
        programId: TOKEN_PROGRAM_ID,
      }),
    )

    transaction.add(
      initializeAccount({
        account: wrappedSolAccount.publicKey,
        mint: WRAPPED_SOL_MINT,
        owner: owner.publicKey,
      }),
    )

    let leverageTokenAccountPk = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMintPk,
      owner.publicKey,
    )
    const tokenAccountExists = await this.connection.getAccountInfo(
      leverageTokenAccountPk,
      'recent',
    )
    if (!tokenAccountExists) {
      transaction.add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenMintPk,
          leverageTokenAccountPk,
          owner.publicKey,
          owner.publicKey,
        ),
      )
    }

    const mintLeverageTokenInstruction = makeMintLeverageTokenInstruction(
      this.programId,
      quasarGroupPk,
      tokenMintPk,
      leverageTokenAccountPk,
      mangoProgram,
      mangoGroupPk,
      mangoAccountPk,
      owner.publicKey,
      mangoCachePk,
      mangoRootBankPk,
      mangoNodeBankPk,
      mangoVaultPk,
      wrappedSolAccount.publicKey,
      pda,
      quantity,
    )
    transaction.add(mintLeverageTokenInstruction)

    transaction.add(
      closeAccount({
        source: wrappedSolAccount.publicKey,
        destination: owner.publicKey,
        owner: owner.publicKey,
      }),
    )

    const signers = [wrappedSolAccount]
    return await this.sendTransaction(transaction, owner, signers)
  }

  async burnLeverageToken(
    quasarGroupPk: PublicKey,
    tokenMintPk: PublicKey,
    quoteTokenMintPk: PublicKey,
    mangoProgram: PublicKey,
    mangoGroupPk: PublicKey,
    mangoAccountPk: PublicKey,
    owner: Account | WalletAdapter,
    mangoCachePk: PublicKey,
    mangoRootBankPk: PublicKey,
    mangoNodeBankPk: PublicKey,
    mangoVaultPk: PublicKey,
    pda: PublicKey,
    mangoPda: PublicKey,
    mangoSpotOpenOrders: PublicKey[],
    quantity: BN,
  ): Promise<TransactionSignature> {
    const transaction = new Transaction()

    let quoteTokenAccountPk = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      quoteTokenMintPk,
      owner.publicKey,
    )
    const quoteTokenAccountExists = await this.connection.getAccountInfo(
      quoteTokenAccountPk,
      'recent',
    )
    if (!quoteTokenAccountExists) {
      transaction.add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          quoteTokenMintPk,
          quoteTokenAccountPk,
          owner.publicKey,
          owner.publicKey,
        ),
      )
    }

    let leverageTokenAccountPk = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenMintPk,
      owner.publicKey,
    )
    const tokenAccountExists = await this.connection.getAccountInfo(
      leverageTokenAccountPk,
      'recent',
    )
    if (!tokenAccountExists) {
      transaction.add(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenMintPk,
          leverageTokenAccountPk,
          owner.publicKey,
          owner.publicKey,
        ),
      )
    }

    const mintLeverageTokenInstruction = makeBurnLeverageTokenInstruction(
      this.programId,
      quasarGroupPk,
      tokenMintPk,
      leverageTokenAccountPk,
      mangoProgram,
      mangoGroupPk,
      mangoAccountPk,
      owner.publicKey,
      mangoCachePk,
      mangoRootBankPk,
      mangoNodeBankPk,
      mangoVaultPk,
      quoteTokenAccountPk,
      pda,
      mangoPda,
      mangoSpotOpenOrders,
      quantity,
    )
    transaction.add(mintLeverageTokenInstruction)

    const signers = []
    return await this.sendTransaction(transaction, owner, signers)
  }
}
