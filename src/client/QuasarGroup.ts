import { Connection, PublicKey } from '@solana/web3.js'
import { Big } from 'big.js'
import BN from 'bn.js'
import {
  getTokenByMint,
  GroupConfig,
  I80F48,
  ONE_I80F48,
} from '@blockworks-foundation/mango-client'
import {
  MetaData,
  BaseToken,
  MAX_BASE_TOKENS,
  MAX_LEVERAGE_TOKENS,
} from './layout'
import { zeroKey } from './utils'
import LeverageToken from './LeverageToken'

export default class QuasarGroup {
  publicKey: PublicKey
  metaData!: MetaData

  numBaseTokens!: number
  baseTokens!: BaseToken[]

  numLeverageTokens!: number
  leverageTokens!: LeverageToken[]

  signerNonce!: BN
  signerKey!: PublicKey
  adminKey!: PublicKey
  mangoProgramId!: PublicKey

  constructor(publicKey: PublicKey, decoded: any) {
    this.publicKey = publicKey
    Object.assign(this, decoded)
  }

  getBaseTokenIndex(token: PublicKey): number {
    for (let i = 0; i < this.baseTokens.length; i++) {
      if (this.baseTokens[i].mint.equals(token)) {
        return i
      }
    }
    throw new Error('This token does not belong in this QuasarGroup')
  }

  getLeverageTokenIndex(
    baseTokenMint: PublicKey,
    targetLeverage: I80F48,
  ): number {
    for (let i = 0; i < this.leverageTokens.length; i++) {
      if (
        this.leverageTokens[i].baseTokenMint.equals(baseTokenMint) &&
        this.leverageTokens[i].targetLeverage.eq(targetLeverage)
      ) {
        return i
      }
    }
    throw new Error('This token does not belong in this QuasarGroup')
  }

  getLeverageTokenIndexByMint(token: PublicKey): number {
    for (let i = 0; i < this.leverageTokens.length; i++) {
      if (this.leverageTokens[i].mint.equals(token)) {
        return i
      }
    }
    throw new Error('This token does not belong in this QuasarGroup')
  }
}
