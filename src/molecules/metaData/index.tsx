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
import { LeverageToken } from '../../client'
import useQuasarStore, {
  mangoProgramId,
  serumProgramId,
} from '../../stores/useQuasarStore'
import { formatUsdValue } from '../../utils'
import useWallet from '../../hooks/useWallet'
import styled from '@emotion/styled'
import Button from '../../components/button'
import StyleText from '../../components/styleText'
import useInterval from '../../hooks/useInterval'
import { LEVERAGE_TOKEN } from '../../constants'

const MetaData = () => {
  const { tokenMint } = {
    tokenMint: LEVERAGE_TOKEN.BTC.TRIPLE,
  }

  const { wallet } = useWallet()

  const quasarClient = useQuasarStore((s) => s.connection.client)
  const mangoClient = useQuasarStore((s) => s.connection.mangoClient)
  const quasarGroup = useQuasarStore((s) => s.quasarGroup)
  const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
  const mangoMarkets = useQuasarStore((s) => s.selectedMangoGroup.markets)
  const connection = useQuasarStore((s) => s.connection.current)
  const mangoCache = useQuasarStore((s) => s.selectedMangoGroup.cache)
  const mangoConfig = useQuasarStore((s) => s.selectedMangoGroup.config)

  const [token, setToken] = useState<LeverageToken>()
  const [effectiveLeverage, setEffectiveLeverage] = useState('0')
  const [baseTokenPrice, setBaseTokenPrice] = useState('0')
  const [basketPerp, setBasketPerp] = useState('0')
  const [basketQuote, setBasketQuote] = useState('0')
  const [basketValue, setBasketValue] = useState('0')
  const [outstanding, setOutstanding] = useState('0')
  const [totalFundValue, setTotalFundValue] = useState('0')
  const [totalCollateralValue, setCollateralValue] = useState('0')
  const [tokenPrice, setTokenPrice] = useState('0')

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

  const rebalance = async () => {
    // const quasarGroup = await quasarClient.getQuasarGroup(
    //   new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'),
    // )
    try {
      const tokenMintPk = new PublicKey(LEVERAGE_TOKEN.BTC.TRIPLE)
      const leverageTokenIndex =
        quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
      const leverageToken = quasarGroup.leverageTokens[leverageTokenIndex]
      const mangoAccountPk = leverageToken.mangoAccount

      const mangoAccount = await mangoClient.getMangoAccount(
        mangoAccountPk,
        serumProgramId,
      )

      const perpMarket = mangoMarkets[
        leverageToken.mangoPerpMarket.toBase58()
      ] as PerpMarket

      const rebalanced = await quasarClient.rebalance(
        quasarGroup.publicKey,
        tokenMintPk,
        quasarGroup.signerKey,
        mangoProgramId,
        mangoGroup.publicKey,
        mangoAccountPk,
        wallet,
        mangoGroup.mangoCache,
        perpMarket.publicKey,
        perpMarket.bids,
        perpMarket.asks,
        perpMarket.eventQueue,
        mangoAccount.spotOpenOrders,
      )

      console.log(rebalanced)
    } catch (err) {
      console.warn('Error rebalancing token asset:', err)
    }
  }

  fetchTokenData()
  useInterval(fetchTokenData, 8 * 1000)

  return (
    <Container>
      <RowTitle marginBottom={'40px'}>
        <StyleText
          fontSize={'44px'}
          mobileFontSize={'30px'}
          fontWeight={'700'}
          text={
            token &&
            token.targetLeverage.toString() +
              'X ' +
              token.getBaseSymbol(mangoConfig) +
              ' Leverage Token'
          }
        />
      </RowTitle>
      <Block>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            text={'Target Leverage: '}
            color={'grey'}
            margin={'0px 0px 10px 0px'}
          />
          <FlexibleRow>
            <StyleText fontSize={'16px'} fontWeight={'600'} text={'3.0'} />
            <StyleText fontSize={'16px'} fontWeight={'700'} text={'X'} />
          </FlexibleRow>
        </Row>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            text={'Current Leverage: '}
            color={'grey'}
            margin={'0px 0px 10px 0px'}
          />
          <FlexibleRow>
            <StyleText
              fontSize={'16px'}
              fontWeight={'600'}
              text={effectiveLeverage}
            />
            <StyleText fontSize={'16px'} fontWeight={'700'} text={'X'} />
          </FlexibleRow>
        </Row>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            margin={'0px 0px 10px 0px'}
            text={'Tokens Outstanding: '}
            color={'grey'}
          />
          <FlexibleRow>
            <StyleText
              fontSize={'16px'}
              fontWeight={'600'}
              margin={'0 12px 0 0'}
              text={`${outstanding}`}
            />
            <StyleText
              fontSize={'16px'}
              fontWeight={'600'}
              text={
                token &&
                token.targetLeverage.toString() +
                  `QL` +
                  token.getBaseSymbol(mangoConfig)
              }
            />
          </FlexibleRow>
        </Row>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            text={'Total Fund Value: '}
            margin={'0px 0px 10px 0px'}
            color={'grey'}
          />
          <FlexibleRow>
            <StyleText
              fontSize={'16px'}
              fontWeight={'600'}
              margin={'0 12px 0 0'}
              text={`${totalFundValue}`}
            />
            <StyleText fontSize={'16px'} fontWeight={'600'} text={`USDT`} />
          </FlexibleRow>
        </Row>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            text={'Total Collateral Value: '}
            margin={'0px 0px 10px 0px'}
            color={'grey'}
          />
          <FlexibleRow>
            <StyleText
              fontSize={'16px'}
              fontWeight={'600'}
              margin={'0 12px 0 0'}
              text={`${totalCollateralValue}`}
            />
            <StyleText fontSize={'16px'} fontWeight={'600'} text={`USDT`} />
          </FlexibleRow>
        </Row>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            text={'Basket: '}
            margin={'0px 0px 10px 0px'}
            color={'grey'}
          />
          <Column>
            <FlexibleRow>
              <StyleText
                fontSize={'16px'}
                fontWeight={'600'}
                margin={'0 12px 0 0'}
                text={`${basketPerp}`}
              />
              <StyleText
                fontSize={'16px'}
                fontWeight={'600'}
                text={token && token.getBaseSymbol(mangoConfig) + `-PERP`}
              />
            </FlexibleRow>
            <FlexibleRow>
              <StyleText
                fontSize={'16px'}
                fontWeight={'600'}
                margin={'0 12px 0 0'}
                text={`${basketQuote}`}
              />
              <StyleText fontSize={'16px'} fontWeight={'600'} text={`USDT`} />
            </FlexibleRow>
          </Column>
        </Row>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'16px'}
            fontWeight={'600'}
            text={token && token.getBaseSymbol(mangoConfig) + ' Price: '}
            margin={'0px 0px 10px 0px'}
            color={'grey'}
          />
          <FlexibleRow>
            <StyleText
              fontSize={'16px'}
              fontWeight={'600'}
              margin={'0 12px 0 0'}
              text={`${baseTokenPrice}`}
            />
            <StyleText fontSize={'16px'} fontWeight={'600'} text={`USDT`} />
          </FlexibleRow>
        </Row>
        <Row>
          <Button
            padding={'22px 56px'}
            margin={'0px 28px 0px 0px'}
            text={'Rebalancing'}
            onClick={rebalance}
          />
        </Row>
      </Block>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  color: #ffffff;

  @media only screen and (max-width: 768px) {
    width: 100%;
  }
`

const Block = styled.div`
  display: flex;
  flex-direction: column;
  padding: 40px;
  margin-bottom: 100px;
  border-radius: 20px;
  align-items: flex-start;
  background-color: hsla(0, 0%, 100%, 0.06);

  @media only screen and (max-width: 768px) {
    width: 100%;
  }
`

const FlexibleRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${(props: any) => props.marginBottom};

  @media only screen and (max-width: 768px) {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`

const Row: any = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props: any) => props.marginBottom};
  width: 100%;
  max-width: 480px;

  @media only screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
`
const RowTitle: any = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${(props: any) => props.marginBottom};
  width: 100%;
  max-width: 740px;

  @media only screen and (max-width: 768px) {
    margin-bottom: 20px;
    line-height: 2rem;
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: left;
  margin-top: ${(props: any) => props.marginTop};

  @media only screen and (max-width: 768px) {
    width: 100%;
  }
`

const TokenName = styled.div`
  font-size: 40px;
  font-weight: 700;
`

const TokenPrice = styled.div`
  font-size: 30px;
  font-weight: 500;
`

export default MetaData
