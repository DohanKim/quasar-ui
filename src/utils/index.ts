import { PublicKey } from '@solana/web3.js'

export const copyToClipboard = (copyThis) => {
  const el = document.createElement('textarea')
  el.value = copyThis.toString()
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export function abbreviateAddress(address: PublicKey, size = 5) {
  const base58 = address.toBase58()
  return base58.slice(0, size) + '…' + base58.slice(-size)
}

export function zipDict<K extends string | number | symbol, V>(
  keys: K[],
  values: V[],
) {
  const result: Partial<Record<K, V>> = {}
  keys.forEach((key, index) => {
    result[key] = values[index]
  })
  return result
}
