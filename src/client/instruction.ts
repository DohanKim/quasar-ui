import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js'
import { encodeQuasarInstruction } from './layout'
import BN from 'bn.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { I80F48 } from '@blockworks-foundation/mango-client'

export function makeInitQuasarGroupInstruction(
  programId: PublicKey,
  quasarGroupPk: PublicKey,
  signerKey: PublicKey,
  adminPk: PublicKey,
  mangoProgramPk: PublicKey,

  signerNonce: BN
): TransactionInstruction {
  const keys = [
    { isSigner: false, isWritable: true, pubkey: quasarGroupPk },
    { isSigner: false, isWritable: false, pubkey: signerKey },
    { isSigner: true, isWritable: false, pubkey: adminPk },
    { isSigner: false, isWritable: false, pubkey: mangoProgramPk },
  ]

  const data = encodeQuasarInstruction({
    InitQuasarGroup: {
      signerNonce,
    },
  })

  return new TransactionInstruction({
    keys,
    data,
    programId: programId,
  })
}

export function makeAddBaseTokenInstruction(
  programId: PublicKey,
  quasarGroupPk: PublicKey,
  mintPk: PublicKey,
  oraclePk: PublicKey,
  adminPk: PublicKey
): TransactionInstruction {
  const keys = [
    { isSigner: false, isWritable: true, pubkey: quasarGroupPk },
    { isSigner: false, isWritable: false, pubkey: mintPk },
    { isSigner: false, isWritable: false, pubkey: oraclePk },
    { isSigner: true, isWritable: false, pubkey: adminPk },
  ]

  const data = encodeQuasarInstruction({
    AddBaseToken: {},
  })

  return new TransactionInstruction({
    keys,
    data,
    programId: programId,
  })
}
