import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import Button from '../../components/button'
import Tag from '../../components/tag'
import GreyButton from '../../components/greyButton'
import StyleText from '../../components/styleText'
import Modal from '../../components/modal'
import InputText from '../../components/inputText'

import useQuasarStore, { serumProgramId } from '../../stores/useQuasarStore'

import {
  I80F48,
  MangoAccount,
  MangoClient,
  nativeToUi,
  ONE_I80F48,
  PerpMarket,
  QUOTE_INDEX,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'

import { Keypair, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { mangoProgramId } from '../../stores/useQuasarStore'
import { notify } from '../../utils/notifications'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import useHydrateStore from '../../hooks/useHydrateStore'
import useWallet from '../../hooks/useWallet'

import { LEVERAGE_TOKEN } from '../../constants'

import icUSDT from '../images/ic_usdt.png'
import icUSDC from '../images/ic_usdc.png'
import icSOL from '../images/ic_solana.png'
import icBTC from '../images/ic_btc.png'
import icETH from '../images/ic_eth.png'
import { LeverageToken } from '../../client'
import { formatUsdValue } from '../../utils'
import useInterval from '../../hooks/useInterval'

const MintButton = () => {
  useHydrateStore()
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
  const [quantity, setQuantity] = useState(0.1)

  useEffect(() => {
    fetchTokenData()
  }, [])

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

  const handleTextChange =
    (setFn) =>
    ({ target: { value } }) =>
      setFn(value)

  const mintLeverageToken = async () => {
    // const wallet = useQuasarStore.getState().wallet.current
    const quasarGroup = await quasarClient.getQuasarGroup(
      new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'),
    )
    console.log(mangoGroup)

    try {
      const tokenMintPk = new PublicKey(LEVERAGE_TOKEN.BTC.TRIPLE)
      const quoteTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112',
      )
      const leverageTokenIndex =
        quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
      const quoteTokenIndex = mangoGroup.getTokenIndex(quoteTokenMint)

      console.log(new BN(inputLeverageToken))

      const leverageToken = await quasarClient.mintLeverageToken(
        quasarGroup.publicKey,
        tokenMintPk,
        mangoProgramId,
        mangoGroup.publicKey,
        quasarGroup.leverageTokens[leverageTokenIndex].mangoAccount,
        wallet,
        mangoGroup.mangoCache,
        mangoGroup.tokens[quoteTokenIndex].rootBank,
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBanks[0],
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBankAccounts[0].vault,
        quasarGroup.signerKey,
        new BN(inputLeverageToken),
      )
      notify({
        title: 'leverage token minted',
      })

      setModalVisible(false)

      console.log(leverageToken.toString())
    } catch (err) {
      console.warn('Error minting leverage token:', err)
      notify({
        title: 'Could not mint a leverage token',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  const burnLeverageToken = async () => {
    const quasarGroup = await quasarClient.getQuasarGroup(
      new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'),
    )
    console.log(mangoGroup)
    try {
      const tokenMintPk = new PublicKey(LEVERAGE_TOKEN.BTC.TRIPLE)
      const quoteTokenMint = new PublicKey(
        'So11111111111111111111111111111111111111112',
      )
      const leverageTokenIndex =
        quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
      const quoteTokenIndex = mangoGroup.getTokenIndex(quoteTokenMint)
      const mangoAccountPk =
        quasarGroup.leverageTokens[leverageTokenIndex].mangoAccount

      const mangoAccount = await mangoClient.getMangoAccount(
        mangoAccountPk,
        serumProgramId,
      )

      const leverageToken = await quasarClient.burnLeverageToken(
        quasarGroup.publicKey,
        tokenMintPk,
        new PublicKey('So11111111111111111111111111111111111111112'),
        mangoProgramId,
        mangoGroup.publicKey,
        mangoAccountPk,
        wallet,
        mangoGroup.mangoCache,
        mangoGroup.tokens[quoteTokenIndex].rootBank,
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBanks[0],
        mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBankAccounts[0].vault,
        quasarGroup.signerKey,
        mangoGroup.signerKey,
        mangoAccount.spotOpenOrders,

        new BN(inputLeverageToken),
      )
      notify({
        title: 'leverage token burned',
      })

      console.log(leverageToken.toString())
    } catch (err) {
      console.warn('Error burning leverage token:', err)
      notify({
        title: 'Could not burn a leverage token',
        description: `${err}`,
        type: 'error',
      })
    }
  }

  const tokenList = [
    {
      index: 1,
      name: 'USDT',
      img: icUSDT,
      price: 1,
    },
    {
      index: 2,
      name: 'USDC',
      img: icUSDC,
      price: 1,
    },
    {
      index: 3,
      name: 'BTC',
      img: icBTC,
      price: 61718,
    },
    {
      index: 4,
      name: 'ETH',
      img: icETH,
      price: 3888,
    },
    {
      index: 5,
      name: 'SOL',
      img: icSOL,
      price: 162,
    },
  ]

  const [modalVisible, setModalVisible] = useState(false)
  const [tokenListVisible, setTokenListVisible] = useState(false)
  const [currentDepositToken, setCurrentDepositToken] = useState(tokenList[0])
  const [inputLeverageToken, setInputLeverageToken] = useState(0)

  const [redeemModalVisible, setRedeemModalVisible] = useState(false)

  const openModal = () => {
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
  }

  const openTokenList = () => {
    setTokenListVisible(true)
  }

  const closeTokenList = () => {
    setTokenListVisible(false)
  }

  const selectDepositToken = (token) => {
    console.log(token)
    setCurrentDepositToken(token)
    closeTokenList()
  }

  const calcLeverageTokenPrice = (depositTokenPrice) => {
    return parseFloat(
      String(inputLeverageToken * parseFloat(tokenPrice.split('$')[1])),
    ).toFixed(2)
  }

  const handleLeverageTokenInputChange = (e) => {
    setInputLeverageToken(e.target.value)
  }

  const openRedeemModal = () => {
    setRedeemModalVisible(true)
  }

  const closeRedeemModal = () => {
    setRedeemModalVisible(false)
  }

  useInterval(fetchTokenData, 12 * 1000)

  return (
    <Container>
      {modalVisible && (
        <Modal
          className={''}
          height={''}
          visible={modalVisible}
          closable={true}
          width={'420px'}
          maskClosable={true}
          onClose={closeModal}
        >
          <Row marginBottom={'20px'}>
            <ModalTitle>Create</ModalTitle>
          </Row>
          <Row marginBottom={'5px'}>
            <InputText
              width={'100px'}
              marginRight={'20px'}
              color={'#fff'}
              onChange={handleLeverageTokenInputChange}
            />
            <TokenName>
              {token &&
                token.targetLeverage.toString() +
                  `QL` +
                  token.getBaseSymbol(mangoConfig)}
            </TokenName>
          </Row>
          <Row marginBottom={'30px'}>
            Required {currentDepositToken.name} :{' '}
            {calcLeverageTokenPrice(currentDepositToken.price)}
            <GreyButton
              padding={'10px 20px 10px 20px'}
              margin={'0px 0px 0px 20px'}
              onClick={openTokenList}
              text={'Select token'}
            />
          </Row>
          <Row justifyContent={'center'}>
            <Button
              padding={'10px 40px 10px 40px'}
              onClick={mintLeverageToken}
              text={'Mint'}
            />
            {/*<GreyButton padding={"10px 20px 10px 20px"}*/}
            {/*            onClick={handleMinting}*/}
            {/*            text={"Mint"}/>*/}
          </Row>
        </Modal>
      )}
      {redeemModalVisible && (
        <Modal
          className={''}
          height={''}
          visible={redeemModalVisible}
          closable={true}
          width={'420px'}
          maskClosable={true}
          onClose={closeRedeemModal}
        >
          <Row marginBottom={'20px'}>
            <ModalTitle>Redeem</ModalTitle>
          </Row>
          <Row marginBottom={'5px'}>
            <InputText
              width={'100px'}
              marginRight={'20px'}
              color={'#fff'}
              onChange={handleLeverageTokenInputChange}
            />
            <TokenName>
              {token &&
                token.targetLeverage.toString() +
                  `QL` +
                  token.getBaseSymbol(mangoConfig)}
            </TokenName>
          </Row>
          <Row marginBottom={'30px'}>
            You will receive {currentDepositToken.name} :{' '}
            {calcLeverageTokenPrice(currentDepositToken.price)}
            <GreyButton
              padding={'10px 20px 10px 20px'}
              margin={'0px 0px 0px 20px'}
              onClick={openTokenList}
              text={'Select token'}
            />
          </Row>
          <Row justifyContent={'center'}>
            <Button
              padding={'10px 40px 10px 40px'}
              onClick={burnLeverageToken}
              text={'Burn'}
            />
            {/*<GreyButton padding={"10px 20px 10px 20px"}*/}
            {/*            onClick={handleMinting}*/}
            {/*            text={"Mint"}/>*/}
          </Row>
        </Modal>
      )}
      {tokenListVisible && (
        <Modal
          className={''}
          visible={tokenListVisible}
          width={'400px'}
          height={'500px'}
          closable={true}
          maskClosable={true}
          onClose={closeTokenList}
        >
          <Row marginBottom={'30px'}>
            <ModalTitle>Token list</ModalTitle>
          </Row>
          <Row>
            <TokenList>
              {tokenList.map((token) => {
                return (
                  <TokenItem marginBottom={'20px'}>
                    <Row>
                      <TokenIcon>
                        <img width={'24px'} src={token.img} />
                      </TokenIcon>
                      <div>{token.name}</div>
                    </Row>
                    <div>
                      <GreyButton
                        padding={'10px 20px 10px 20px'}
                        text={'Select'}
                        onClick={() => selectDepositToken(token)}
                      />
                    </div>
                  </TokenItem>
                )
              })}
            </TokenList>
          </Row>
        </Modal>
      )}
      <Row marginBottom={'40px'}>
        <StyleText
          fontSize={'44px'}
          mobileFontSize={'30px'}
          fontWeight={'700'}
          text={'Mint Tokens'}
        />
      </Row>
      <Block>
        <Row marginBottom={'20px'}>
          <StyleText
            fontSize={'40px'}
            mobileFontSize={'28px'}
            fontWeight={'700'}
            text={
              token &&
              token.targetLeverage.toString() +
                `QL` +
                token.getBaseSymbol(mangoConfig)
            }
          />
        </Row>
        <Row marginBottom={'40px'}>
          <StyleText
            fontSize={'30px'}
            margin={'0px 20px 0px 0px'}
            mobileFontSize={'24px'}
            fontWeight={'500'}
            text={tokenPrice}
          />
          {/* <Tag color={'#46BD77'} text={'+ 10%'} /> */}
        </Row>
        <Row>
          <Button
            text={
              token
                ? 'Mint ' +
                  token.targetLeverage.toString() +
                  `QL` +
                  token.getBaseSymbol(mangoConfig)
                : 'Mint'
            }
            // onClick={mintLeverageToken}
            onClick={openModal}
            padding={'22px 56px'}
            margin={'0px 28px 0px 0px'}
          />
          <Margin mobileMarginBottom={'20px'} />
          <GreyButton
            onClick={openRedeemModal}
            text={'Burn'}
            padding={'22px 56px'}
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
`

const Block = styled.div`
  display: flex;
  flex-direction: column;
  padding: 40px;
  margin-bottom: 100px;
  border-radius: 20px;
  align-items: flex-start;
  background-color: hsla(0, 0%, 100%, 0.06);
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: ${(props) => props.justifyContent};
  align-items: center;
  align-content: center;
  margin-bottom: ${(props) => props.marginBottom};

  @media only screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`

const ModalTitle = styled.div`
  font-size: 36px;
  font-weight: 700;
`

const TokenName = styled.div`
  font-size: 18px;
  font-weight: 600;
`

const TokenList = styled.div`
  display: flex;
  flex-direction: column;
  height: 480px;
`

const TokenItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  width: 350px;
  margin-bottom: ${(props) => props.marginBottom};
`

const TokenIcon = styled.div`
  margin-right: 20px;
`

const Margin = styled.div`
  margin-bottom: ${(props) => props.marginBottom};

  @media only screen and (max-width: 768px) {
    margin-bottom: ${(props) => props.mobileMarginBottom};
  }
`

export default MintButton
