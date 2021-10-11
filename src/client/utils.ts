import BN from 'bn.js'
import {
  Account,
  AccountInfo,
  Commitment,
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  TransactionConfirmationStatus,
  TransactionInstruction,
  TransactionSignature,
  Keypair,
} from '@solana/web3.js'
import { OpenOrders, TokenInstructions } from '@project-serum/serum'
// import { I80F48, ONE_I80F48 } from './fixednum';
// import MangoGroup from './MangoGroup';
// import { HealthType } from './MangoAccount';

export const ZERO_BN = new BN(0)
export const zeroKey = new PublicKey(new Uint8Array(32))

export async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection,
  confirmLevel: TransactionConfirmationStatus,
) {
  let done = false

  const confirmLevels: (TransactionConfirmationStatus | null | undefined)[] = [
    'finalized',
  ]
  console.log('confirmLevel = ', confirmLevel)

  if (confirmLevel === 'confirmed') {
    confirmLevels.push('confirmed')
  } else if (confirmLevel === 'processed') {
    confirmLevels.push('confirmed')
    confirmLevels.push('processed')
  }
  const result = await new Promise((resolve, reject) => {
    ;(async () => {
      setTimeout(() => {
        if (done) {
          return
        }
        done = true
        console.log('Timed out for txid', txid)
        reject({ timeout: true })
      }, timeout)
      try {
        connection.onSignature(
          txid,
          (result) => {
            // console.log('WS confirmed', txid, result);
            done = true
            if (result.err) {
              reject(result.err)
            } else {
              resolve(result)
            }
          },
          'processed',
        )
        // console.log('Set up WS connection', txid);
      } catch (e) {
        done = true
        console.log('WS error in setup', txid, e)
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        ;(async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ])
            const result = signatureStatuses && signatureStatuses.value[0]
            if (!done) {
              if (!result) {
                // console.log('REST null result for', txid, result);
              } else if (result.err) {
                console.log('REST error for', txid, result)
                done = true
                reject(result.err)
              } else if (
                !(
                  result.confirmations ||
                  confirmLevels.includes(result.confirmationStatus)
                )
              ) {
                console.log('REST not confirmed', txid, result)
              } else {
                console.log('REST confirmed', txid, result)
                done = true
                resolve(result)
              }
            }
          } catch (e) {
            if (!done) {
              console.log('REST connection error: txid', txid, e)
            }
          }
        })()
        await sleep(300)
      }
    })()
  })

  done = true
  return result
}

export async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching,
  )

  const signData = transaction.serializeMessage()
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData)
  const encodedTransaction = wireTransaction.toString('base64')
  const config: any = { encoding: 'base64', commitment }
  const args = [encodedTransaction, config]

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args)
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message)
  }
  return res.result
}

export async function createAccountInstruction(
  connection: Connection,
  payer: PublicKey,
  space: number,
  owner: PublicKey,
  lamports?: number,
): Promise<{ keypair: Keypair; instruction: TransactionInstruction }> {
  const keypair = new Keypair()
  const instruction = SystemProgram.createAccount({
    fromPubkey: payer,
    newAccountPubkey: keypair.publicKey,
    lamports: lamports
      ? lamports
      : await connection.getMinimumBalanceForRentExemption(space),
    space,
    programId: owner,
  })

  return { keypair, instruction }
}

export async function createTokenAccountInstructions(
  connection: Connection,
  payer: PublicKey,
  account: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
): Promise<TransactionInstruction[]> {
  return [
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account,
      lamports: await connection.getMinimumBalanceForRentExemption(165),
      space: 165,
      programId: TokenInstructions.TOKEN_PROGRAM_ID,
    }),
    TokenInstructions.initializeAccount({
      account: account,
      mint,
      owner,
    }),
  ]
}

export async function createSignerKeyAndNonce(
  programId: PublicKey,
  accountKey: PublicKey,
): Promise<{ signerKey: PublicKey; signerNonce: number }> {
  for (let nonce = 0; nonce <= Number.MAX_SAFE_INTEGER; nonce++) {
    try {
      const nonceBuffer = Buffer.alloc(8)
      nonceBuffer.writeUInt32LE(nonce, 0)
      const seeds = [accountKey.toBuffer(), nonceBuffer]
      const key = await PublicKey.createProgramAddress(seeds, programId)
      return {
        signerKey: key,
        signerNonce: nonce,
      }
    } catch (e) {
      continue
    }
  }

  throw new Error('Could not generate signer key')
}
