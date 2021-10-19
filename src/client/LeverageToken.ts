import { GroupConfig, I80F48 } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import { getTokenByMint } from './config'
import { zeroKey } from './utils'

export default class LeverageToken {
  mint!: PublicKey
  baseTokenMint!: PublicKey
  targetLeverage!: I80F48
  mangoAccount!: PublicKey
  mangoPerpMarket!: PublicKey
  padding!: number[]

  constructor(decoded: any) {
    Object.assign(this, decoded)
  }

  isEmpty(): boolean {
    return this.mint.equals(zeroKey)
  }

  getBaseSymbol(mangoConfig: GroupConfig): string {
    return getTokenByMint(mangoConfig, this.baseTokenMint)?.symbol
  }
}
