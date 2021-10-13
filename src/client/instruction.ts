import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  SystemProgram,
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

  signerNonce: BN,
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
  adminPk: PublicKey,
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

//  [quasar_group_ai, mint_ai, base_token_mint_ai, mango_program_ai, mango_group_ai, mango_account_ai, mango_perp_market_ai, system_program_ai, token_program_ai, rent_program_ai, admin_ai] =
export function makeAddLeverageTokenInstruction(
  programId: PublicKey,
  quasarGroupPk: PublicKey,
  mintPk: PublicKey,
  baseTokenMintPk: PublicKey,
  mangoProgramPk: PublicKey,
  mangoGroupPk: PublicKey,
  mangoAccountPk: PublicKey,
  mangoPerpMarketPk: PublicKey,
  adminPk: PublicKey,
  pda: PublicKey,

  targetLeverage: I80F48,
): TransactionInstruction {
  const keys = [
    { isSigner: false, isWritable: true, pubkey: quasarGroupPk },
    { isSigner: true, isWritable: true, pubkey: mintPk },
    { isSigner: false, isWritable: false, pubkey: baseTokenMintPk },
    { isSigner: false, isWritable: false, pubkey: mangoProgramPk },
    { isSigner: false, isWritable: false, pubkey: mangoGroupPk },
    { isSigner: false, isWritable: true, pubkey: mangoAccountPk },
    { isSigner: false, isWritable: false, pubkey: mangoPerpMarketPk },
    { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_RENT_PUBKEY },
    { isSigner: true, isWritable: false, pubkey: adminPk },
    { isSigner: false, isWritable: false, pubkey: pda },
  ]

  const data = encodeQuasarInstruction({
    AddLeverageToken: {
      targetLeverage,
    },
  })

  return new TransactionInstruction({
    keys,
    data,
    programId: programId,
  })
}

export function makeMintLeverageTokenInstruction(
  programId: PublicKey,
  quasarGroupPk: PublicKey,
  tokenMintPk: PublicKey,
  ownerLeverageTokenAccountPk: PublicKey,
  mangoProgramPk: PublicKey,
  mangoGroupPk: PublicKey,
  mangoAccountPk: PublicKey,
  owner: PublicKey,
  mangoCachePk: PublicKey,
  mangoRootBankPk: PublicKey,
  mangoNodeBankPk: PublicKey,
  mangoVaultPk: PublicKey,
  ownerQuoteTokenAccountPk: PublicKey,
  pda: PublicKey,

  quantity: BN,
): TransactionInstruction {
  const keys = [
    { isSigner: false, isWritable: false, pubkey: quasarGroupPk },
    { isSigner: false, isWritable: true, pubkey: tokenMintPk },
    { isSigner: false, isWritable: true, pubkey: ownerLeverageTokenAccountPk },
    { isSigner: false, isWritable: false, pubkey: mangoProgramPk },
    { isSigner: false, isWritable: false, pubkey: mangoGroupPk },
    { isSigner: false, isWritable: true, pubkey: mangoAccountPk },
    { isSigner: true, isWritable: false, pubkey: owner },
    { isSigner: false, isWritable: false, pubkey: mangoCachePk },
    { isSigner: false, isWritable: false, pubkey: mangoRootBankPk },
    { isSigner: false, isWritable: true, pubkey: mangoNodeBankPk },
    { isSigner: false, isWritable: true, pubkey: mangoVaultPk },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: true, pubkey: ownerQuoteTokenAccountPk },
    { isSigner: false, isWritable: false, pubkey: pda },
  ]

  const data = encodeQuasarInstruction({
    MintLeverageToken: {
      quantity,
    },
  })

  return new TransactionInstruction({
    keys,
    data,
    programId: programId,
  })
}
