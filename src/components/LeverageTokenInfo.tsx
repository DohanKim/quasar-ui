import {
  I80F48,
  nativeToUi,
  ONE_I80F48,
  PerpMarket,
  QUOTE_INDEX,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { PublicKey } from '@solana/web3.js'
import { useEffect, useState } from 'react'
import BN from 'bn.js'
import { LeverageToken } from '../client'
import useQuasarStore, { serumProgramId } from '../stores/useQuasarStore'
import BurnLeverageTokenForm from './BurnLeverageTokenForm'
import MintLeverageTokenForm from './MintLeverageTokenForm'
import RebalanceForm from './RebalanceForm.tsx'
import useInterval from '../hooks/useInterval'

const LeverageTokenInfo = (props) => {
  const { tokenMint } = props
  const quasarClient = useQuasarStore((s) => s.connection.client)
  const mangoClient = useQuasarStore((s) => s.connection.mangoClient)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
  const mangoMarkets = useQuasarStore((s) => s.selectedMangoGroup.markets)
  const connection = useQuasarStore((s) => s.connection.current)
  const mangoCache = useQuasarStore((s) => s.selectedMangoGroup.cache)
  const mangoConfig = useQuasarStore((s) => s.selectedMangoGroup.config)

  const [token, setToken] = useState<LeverageToken>()
  const [effectiveLeverage, setEffectiveLeverage] = useState('')
  const [baseTokenPrice, setBaseTokenPrice] = useState('')
  const [basketPerp, setBasketPerp] = useState('')
  const [basketQuote, setBasketQuote] = useState('')
  const [basketValue, setBasketValue] = useState('')
  const [outstanding, setOutstanding] = useState('')
  const [totalFundValue, setTotalFundValue] = useState('')
  const [totalCollateralValue, setCollateralValue] = useState('')
  const [tokenPrice, setTokenPrice] = useState('')

  useEffect(() => {
    if (quasarGroup) {
      const tokenIndex = quasarGroup.getLeverageTokenIndexByMint(
        new PublicKey(tokenMint),
      )
      setToken(quasarGroup.leverageTokens[tokenIndex])
    }
  }, [quasarGroup, tokenMint])

  const fetchTokenData = async () => {
    if (
      token == null ||
      tokenMint == null ||
      connection == null ||
      quasarGroup == null ||
      mangoCache == null ||
      mangoGroup == null ||
      mangoMarkets == null
    )
      return
    console.log('fetch token data')

    const perpMarket = mangoMarkets[
      token.mangoPerpMarket.toBase58()
    ] as PerpMarket
    const baseLotSize = perpMarket.baseLotSize

    const mangoAccount = await mangoClient.getMangoAccount(
      token.mangoAccount,
      serumProgramId,
    )

    const perpMarketIndex = mangoGroup.getPerpMarketIndex(perpMarket.publicKey)
    const perpAccount = mangoAccount.perpAccounts[perpMarketIndex]

    const tokenMintAccount = new Token(
      connection,
      token.mint,
      TOKEN_PROGRAM_ID,
      null,
    )
    const mintInfo = await tokenMintAccount.getMintInfo()
    const outstanding = mintInfo.supply
    setOutstanding(mintInfo.supply.toString())

    const basePosition = perpAccount.basePosition
    const basketPerp = nativeToUi(
      I80F48.fromString(basePosition.toString())
        .mul(I80F48.fromString(perpMarket.baseLotSize.toString()))
        .div(I80F48.fromString(outstanding.toString()))
        .toNumber(),
      perpMarket.baseDecimals,
    )
    setBasketPerp(basketPerp.toString())

    let spotAssetsVal = ZERO_I80F48
    spotAssetsVal = spotAssetsVal.add(
      mangoAccount.getUiDeposit(
        mangoCache.rootBankCache[QUOTE_INDEX],
        mangoGroup,
        QUOTE_INDEX,
      ),
    )

    for (let i = 0; i < mangoGroup.numOracles; i++) {
      let assetWeight = ONE_I80F48
      const spotVal = mangoAccount.getSpotVal(
        mangoGroup,
        mangoCache,
        i,
        assetWeight,
      )
      spotAssetsVal = spotAssetsVal.add(spotVal)
    }
    setCollateralValue(spotAssetsVal.toString())

    const nav = await mangoAccount.computeValue(mangoGroup, mangoCache)
    setTotalFundValue(nav.toString())

    const basketValue = nav.div(I80F48.fromString(outstanding.toString()))
    setBasketValue(basketValue.toString())

    const tokenPrice = nav.div(I80F48.fromString(outstanding.toString()))
    setTokenPrice(tokenPrice.toString())

    const price = mangoCache.priceCache[perpMarketIndex].price
    setBaseTokenPrice(price.toString())

    setBasketQuote(
      basketValue.sub(price.mul(I80F48.fromNumber(basketPerp))).toString(),
    )

    const exposure = price.mul(
      I80F48.fromNumber(
        nativeToUi(
          basePosition.mul(baseLotSize).toNumber(),
          perpMarket.baseDecimals,
        ),
      ),
    )
    setEffectiveLeverage(exposure.div(nav).toString())
  }

  fetchTokenData()
  useInterval(fetchTokenData, 3 * 1000)

  return (
    <>
      {token == null ? null : (
        <>
          <div>
            {token.getBaseSymbol(mangoConfig)} x
            {token.targetLeverage.toString()}
          </div>
          <div>
            <div>Token price: {tokenPrice}</div>
            <div>
              {token.getBaseSymbol(mangoConfig)} Token price: {baseTokenPrice}
            </div>
            <div>Current Leverage: {effectiveLeverage}</div>
            <div>Tokens Outstanding: {outstanding}</div>
            <div>
              Basket: {basketPerp} {token.getBaseSymbol(mangoConfig)}-PERP |{' '}
              {basketQuote} USDC
            </div>
            <div>Basket Value: {basketValue}</div>
            <div>Total Fund Value: {totalFundValue}</div>
            <div>Total Collateral Value: {totalCollateralValue}</div>
          </div>
        </>
      )}
    </>
  )
}

export default LeverageTokenInfo
