import {
  blob,
  Blob,
  greedy,
  Layout,
  nu64,
  seq,
  struct,
  Structure,
  u16,
  u32,
  u8,
  UInt,
  union,
} from 'buffer-layout'
import { PublicKey } from '@solana/web3.js'
import { I80F48 } from '@blockworks-foundation/mango-client'
import BN from 'bn.js'
import { zeroKey } from './utils'

export const MAX_BASE_TOKENS = 16
export const MAX_LEVERAGE_TOKENS = 32

class _I80F48Layout extends Blob {
  constructor(property: string) {
    super(16, property)
  }

  decode(b, offset) {
    let result = new BN(super.decode(b, offset), 10, 'le')
    result = result.fromTwos(8 * this['length'])
    return new I80F48(result)
  }

  encode(src, b, offset) {
    src = src.toTwos(8 * this['length'])
    return super.encode(src.toArrayLike(Buffer, 'le', this['span']), b, offset)
  }
}

export function I80F48Layout(property = '') {
  return new _I80F48Layout(property)
}

class BNLayout extends Blob {
  signed: boolean

  constructor(number: number, property, signed = false) {
    super(number, property)
    this.signed = signed

    // restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype)
  }

  decode(b, offset) {
    let result = new BN(super.decode(b, offset), 10, 'le')
    if (this.signed) result = result.fromTwos(8 * this['length'])
    return result
  }

  encode(src, b, offset) {
    if (this.signed) src = src.toTwos(8 * this['length'])
    return super.encode(src.toArrayLike(Buffer, 'le', this['span']), b, offset)
  }
}

export function u64(property = '') {
  return new BNLayout(8, property)
}

export function i64(property = '') {
  return new BNLayout(8, property, true)
}

export function u128(property?: string) {
  return new BNLayout(16, property)
}

export function i128(property?: string) {
  return new BNLayout(16, property, true)
}

class WrappedLayout<T, U> extends Layout<U> {
  layout: Layout<T>
  decoder: (data: T) => U
  encoder: (src: U) => T

  constructor(
    layout: Layout<T>,
    decoder: (data: T) => U,
    encoder: (src: U) => T,
    property?: string,
  ) {
    super(layout.span, property)
    this.layout = layout
    this.decoder = decoder
    this.encoder = encoder
  }

  decode(b: Buffer, offset?: number): U {
    return this.decoder(this.layout.decode(b, offset))
  }

  encode(src: U, b: Buffer, offset?: number): number {
    return this.layout.encode(this.encoder(src), b, offset)
  }

  getSpan(b: Buffer, offset?: number): number {
    return this.layout.getSpan(b, offset)
  }
}

export function bool(property?: string) {
  return new WrappedLayout(u8(), decodeBool, encodeBool, property)
}

function decodeBool(value: number): boolean {
  if (value === 0) {
    return false
  } else if (value === 1) {
    return true
  }
  throw new Error('Invalid bool: ' + value)
}

function encodeBool(value: boolean): number {
  return value ? 1 : 0
}

class EnumLayout extends UInt {
  values: any
  constructor(values, span, property?) {
    super(span, property)
    this.values = values
  }
  encode(src, b, offset) {
    if (this.values[src] !== undefined) {
      return super.encode(this.values[src], b, offset)
    }
    throw new Error('Invalid ' + this['property'])
  }

  decode(b, offset) {
    const decodedValue = super.decode(b, offset)
    const entry = Object.entries(this.values).find(
      ([, value]) => value === decodedValue,
    )
    if (entry) {
      return entry[0]
    }
    throw new Error('Invalid ' + this['property'])
  }
}

/**
 * Need to implement layouts for each of the structs found in state.rs
 */
export const QuasarInstructionLayout = union(u32('instruction'))
QuasarInstructionLayout.addVariant(
  0,
  struct([u64('signerNonce')]),
  'InitQuasarGroup',
)
QuasarInstructionLayout.addVariant(1, struct([]), 'AddBaseToken')
QuasarInstructionLayout.addVariant(
  2,
  struct([I80F48Layout('targetLeverage')]),
  'AddLeverageToken',
)
QuasarInstructionLayout.addVariant(
  3,
  struct([u64('quantity')]),
  'MintLeverageToken',
)
QuasarInstructionLayout.addVariant(
  4,
  struct([u64('quantity')]),
  'BurnLeverageToken',
)

const instructionMaxSpan = Math.max(
  // @ts-ignore
  ...Object.values(QuasarInstructionLayout.registry).map((r) => r.span),
)
export function encodeQuasarInstruction(data) {
  console.log('Instruction:', data)
  const b = Buffer.alloc(instructionMaxSpan)
  const span = QuasarInstructionLayout.encode(data, b)
  return b.slice(0, span)
}

export class PublicKeyLayout extends Blob {
  constructor(property) {
    super(32, property)
  }

  decode(b, offset) {
    return new PublicKey(super.decode(b, offset))
  }

  encode(src, b, offset) {
    return super.encode(src.toBuffer(), b, offset)
  }
}
export function publicKeyLayout(property = '') {
  return new PublicKeyLayout(property)
}

export const DataType = {
  QuasarGroup: 0,
  BaseToken: 1,
  LeverageToken: 2,
}

export class MetaData {
  dataType!: number
  version!: number
  isInitialized!: boolean

  constructor(decoded: any) {
    Object.assign(this, decoded)
  }
}

export class MetaDataLayout extends Structure {
  constructor(property) {
    super(
      [
        u8('dataType'),
        u8('version'),
        u8('isInitialized'),
        seq(u8(), 5, 'padding'),
      ],
      property,
    )
  }

  decode(b, offset) {
    return new MetaData(super.decode(b, offset))
  }

  encode(src, b, offset) {
    return super.encode(src.toBuffer(), b, offset)
  }
}
export function metaDataLayout(property = '') {
  return new MetaDataLayout(property)
}

export class BaseToken {
  mint!: PublicKey
  decimals!: number
  oracle!: PublicKey
  padding!: number[]

  constructor(decoded: any) {
    Object.assign(this, decoded)
  }
  isEmpty(): boolean {
    return this.mint.equals(zeroKey)
  }
}

export class BaseTokenLayout extends Structure {
  constructor(property) {
    super(
      [
        publicKeyLayout('mint'),
        u8('decimals'),
        publicKeyLayout('oracle'),
        seq(u8(), 7, 'padding'),
      ],
      property,
    )
  }

  decode(b, offset) {
    return new BaseToken(super.decode(b, offset))
  }

  encode(src, b, offset) {
    return super.encode(src.toBuffer(), b, offset)
  }
}

export function baseTokenLayout(property = '') {
  return new BaseTokenLayout(property)
}

export class LeverageToken {
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
}

export class LeverageTokenLayout extends Structure {
  constructor(property) {
    super(
      [
        publicKeyLayout('mint'),
        publicKeyLayout('baseTokenMint'),
        I80F48Layout('targetLeverage'),
        publicKeyLayout('mangoAccount'),
        publicKeyLayout('mangoPerpMarket'),
      ],
      property,
    )
  }

  decode(b, offset) {
    return new LeverageToken(super.decode(b, offset))
  }

  encode(src, b, offset) {
    return super.encode(src.toBuffer(), b, offset)
  }
}

export function leverageTokenLayout(property = '') {
  return new LeverageTokenLayout(property)
}

export const QuasarGroupLayout = struct([
  metaDataLayout('metaData'),

  u64('numBaseTokens'), //usize?
  seq(baseTokenLayout(), MAX_BASE_TOKENS, 'baseTokens'),

  u64('numLeverageTokens'), //usize?
  seq(leverageTokenLayout(), MAX_LEVERAGE_TOKENS, 'leverageTokens'),

  u64('signerNonce'),
  publicKeyLayout('signerKey'),
  publicKeyLayout('adminKey'),
  publicKeyLayout('mangoProgramId'),
])

export const StubOracleLayout = struct([
  seq(u8(), 8),
  I80F48Layout('price'),
  u64('lastUpdate'),
])

export class PriceCache {
  price!: I80F48
  lastUpdate!: BN

  constructor(decoded: any) {
    Object.assign(this, decoded)
  }
}
export class PriceCacheLayout extends Structure {
  constructor(property) {
    super([I80F48Layout('price'), u64('lastUpdate')], property)
  }

  decode(b, offset) {
    return new PriceCache(super.decode(b, offset))
  }

  encode(src, b, offset) {
    return super.encode(src.toBuffer(), b, offset)
  }
}
export function priceCacheLayout(property = '') {
  return new PriceCacheLayout(property)
}

export const TokenAccountLayout = struct([
  publicKeyLayout('mint'),
  publicKeyLayout('owner'),
  nu64('amount'),
  blob(93),
])
