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
import BurnLeverageTokenForm from '../bu-components/BurnLeverageTokenForm'
import MintLeverageTokenForm from '../bu-components/MintLeverageTokenForm'
import RebalanceForm from '../bu-components/RebalanceForm.tsx'
import useInterval from '../hooks/useInterval'
import { formatUsdValue } from '../utils'
import { LEVERAGE_TOKEN } from '../constants'

const LeverageTokenInfo = ({ match }) => {
  const { tokenMint } = {
    tokenMint: LEVERAGE_TOKEN.BTC.TRIPLE,
  }

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
    setOutstanding(parseFloat(mintInfo.supply.toString()).toFixed(2))

    const basePosition = perpAccount.basePosition
    const basketPerp = nativeToUi(
      I80F48.fromString(basePosition.toString())
        .mul(I80F48.fromString(perpMarket.baseLotSize.toString()))
        .div(I80F48.fromString(outstanding.toString()))
        .toNumber(),
      perpMarket.baseDecimals,
    )
    setBasketPerp(parseFloat(basketPerp.toString()).toFixed(4))

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
    setCollateralValue(formatUsdValue(spotAssetsVal))

    const nav = await mangoAccount.computeValue(mangoGroup, mangoCache)
    setTotalFundValue(formatUsdValue(nav))

    const basketValue = nav.div(I80F48.fromString(outstanding.toString()))
    setBasketValue(formatUsdValue(basketValue))

    const tokenPrice = nav.div(I80F48.fromString(outstanding.toString()))
    setTokenPrice(formatUsdValue(tokenPrice))

    const price = mangoCache.priceCache[perpMarketIndex].price
    setBaseTokenPrice(formatUsdValue(price))

    setBasketQuote(
      formatUsdValue(basketValue.sub(price.mul(I80F48.fromNumber(basketPerp)))),
    )

    const exposure = price.mul(
      I80F48.fromNumber(
        nativeToUi(
          basePosition.mul(baseLotSize).toNumber(),
          perpMarket.baseDecimals,
        ),
      ),
    )
    setEffectiveLeverage(parseFloat(exposure.div(nav).toString()).toFixed(2))
  }

  fetchTokenData()
  useInterval(fetchTokenData, 8 * 1000)

  return (
    <>
      <div>
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
        <MintLeverageTokenForm tokenMint={tokenMint} />
        <BurnLeverageTokenForm tokenMint={tokenMint} />
        <RebalanceForm tokenMint={tokenMint} />
      </div>
    </>
  )
}

export default LeverageTokenInfo
