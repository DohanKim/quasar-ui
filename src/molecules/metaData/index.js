import React from "react";
import styled from 'styled-components';
import Button from "../../components/button";
import Tag from "../../components/tag";
import GreyButton from "../../components/greyButton";
import StyleText from "../../components/styleText";

import useOraclePrice from "../../hooks/useOraclePrice";
import { formatUsdValue } from "../../utils";

import useQuasarStore, { serumProgramId, mangoProgramId } from '../../stores/useQuasarStore'
import { PublicKey } from '@solana/web3.js'
import useWallet from "../../hooks/useWallet";
import { MangoAccount } from "@blockworks-foundation/mango-client";
import useHydrateStore from "../../hooks/useHydrateStore";
import BN from 'bn.js'
import { sleep } from "../../client/utils";

const MetaData = () => {
    useHydrateStore()
    const [leverage, setLeverage] = React.useState(3.05);
    const [basketPerp, setBasketPerp] = React.useState(12.2)
    const [basketUSDT, setBasketUSDT] = React.useState(-15.8)
    const [outstanding, setOutstanding] = React.useState(10)
    const [totalFund, setTotalFund] = React.useState(3000)
    const [tokenPrice, setTokenPrice] = React.useState(300)
    // const [perpPrice, setPerpPrice] = React.useState(0)

    const quasarClient = useQuasarStore((s) => s.connection.client)
    const mangoClient = useQuasarStore((s) => s.connection.mangoClient)
    const quasarGroup = useQuasarStore((s) => s.quasarGroup)
    const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
    const mangoMarkets = useQuasarStore((s) => s.selectedMangoGroup.markets)
    const connection = useQuasarStore((s) => s.connection.current)
    const mangoCache = useQuasarStore((s) => s.selectedMangoGroup.cache)
    const mangoAccount = useQuasarStore((s) => s.selectedMangoAccount.current)

    const perpPrice = useOraclePrice()

    const { wallet } = useWallet()

    React.useEffect(() => {
        const changeTokenBalance = (Math.random() * 3).toFixed(8);
        setInterval(() => {

            // const random = parseInt(Math.random() * 10)
            // const delta = Math.random() * 2
            // if (random % 2 === 0) {
            //     setTokenPrice(price => parseFloat(price) + parseFloat(delta))
            //     setPerpPrice(price => parseFloat(price) + parseFloat(delta))
            // } else {
            //     setTokenPrice(price => parseFloat(price) - parseFloat(delta))
            //     setPerpPrice(price => parseFloat(price) - parseFloat(delta))
            // }
            // calculatingValue(changeTokenBalance)

        }, 3000)
    }, [])



    const getQuasarMangoData = async () => {
        const quasarGroup = await quasarClient.getQuasarGroup(new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'))
        try {
            const tokenMintPk = new PublicKey('9gx8Cot1DvYCzq5xA9V5or5R7USFXvEbESw337hNEipJ')
            const leverageTokenIndex =
                quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
            const leverageToken = quasarGroup.leverageTokens[leverageTokenIndex]
            const mangoAccountPk = leverageToken.mangoAccount


            const mangoAccount = await mangoClient.getMangoAccount(
                mangoAccountPk,
                serumProgramId,
            )

            console.log('@@leverageToken@@', (leverageToken.targetLeverage).toString())
            console.log('@@mangoGroup@@', mangoGroup)
            console.log('@@mangoAccount@@', mangoAccount)

            const perpMarket = mangoMarkets[
                leverageToken.mangoPerpMarket.toBase58()
            ]

            const baseLot = perpMarket.baseLotSize

            const perpAccount = mangoAccount.perpAccounts[1]
            console.log(mangoAccount.perpAccounts, perpAccount.basePosition.toString(), perpAccount.takerBase.toString())

            const basePosition = parseFloat(perpAccount.basePosition.toString())

            const nav = basePosition * baseLot * perpPrice

            console.log('**&&**&&**', nav)

            const computeValue = await mangoAccount.computeValue(mangoGroup, mangoCache)
            setOutstanding(perpAccount.basePosition.toString())
            setTotalFund(computeValue.toFixed(2))
            const accountLeverage = await mangoAccount.getLeverage(mangoGroup, mangoCache)

            setLeverage(accountLeverage.toFixed(2))

            console.log('@$@$@$@$', { basePosition: perpAccount.basePosition.toString(), leverage: accountLeverage.toString(), computeValue: formatUsdValue(computeValue), baseLot: (baseLot).toString(), SolPerpPrice: formatUsdValue(perpPrice) })

            console.log(leverageToken.toString())
        } catch (err) {
            console.warn('Error MangoAccount token asset:', err)

        }
    }


    const rebalance = async () => {
        const quasarGroup = await quasarClient.getQuasarGroup(new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'))
        try {
            const tokenMintPk = new PublicKey('9gx8Cot1DvYCzq5xA9V5or5R7USFXvEbESw337hNEipJ')
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
            ]

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


    const calculatingValue = (changeTokenBalance) => {
        calcBasketPerp(changeTokenBalance)
        calcBasketUSDT(changeTokenBalance)
        calcOutstanding(changeTokenBalance)
        calcTotalFund(changeTokenBalance)
        calcLeverage(changeTokenBalance)
    }

    const calcLeverage = (changeTokenBalance) => {
        // const random = parseInt(Math.random() * 10)
        // const delta = Math.random()
        // if (random % 2 === 0) {
        //     setLeverage(leverage => (parseFloat(leverage) + parseFloat(delta)).toFixed(2))
        // } else {
        //     setLeverage(leverage => (parseFloat(leverage) - parseFloat(delta)).toFixed(2))
        // }

        setLeverage(leverage => parseFloat(parseFloat(basketPerp) * parseFloat(perpPrice) / parseFloat(totalFund)).toFixed(2))
    }

    const calcBasketPerp = (changeTokenBalance) => {
        setBasketPerp(basketPerp => parseFloat(parseFloat(basketPerp) + parseFloat(changeTokenBalance)).toFixed(4))
    }

    const calcBasketUSDT = (changeTokenBalance) => {
        const diffBalance = parseFloat(basketUSDT) - (parseFloat(basketPerp) * parseFloat(perpPrice))
        setBasketUSDT(basketUSDT => parseFloat(parseFloat(basketUSDT) + diffBalance).toFixed(4))
    }

    const calcOutstanding = (changeTokenBalance) => {
        setOutstanding(outstanding => parseFloat(parseFloat(outstanding) + parseFloat(changeTokenBalance)).toFixed(4))
    }

    const calcTotalFund = (changeTokenBalance) => {
        setTotalFund(totalFund => parseFloat(parseFloat(totalFund) + (parseFloat(changeTokenBalance) * parseFloat(tokenPrice))).toFixed(4))
    }

    const rebalancing = () => {
        setLeverage(3.00)
        setBasketPerp(12)
        setBasketUSDT(-15.3)
    }

    return (
        <Container>
            <RowTitle marginBottom={'40px'}>
                <StyleText fontSize={'44px'}
                    mobileFontSize={'30px'}
                    fontWeight={'700'}
                    text={'3X Long Solana Token'} />
                <Button
                    padding={'22px 56px'} margin={'0px 28px 0px 0px'} text={'MangoData'} onClick={getQuasarMangoData}></Button>

                <Button
                    padding={'22px 56px'} margin={'0px 28px 0px 0px'} text={'Rebalancing'} onClick={rebalance}></Button>
            </RowTitle>
            <Block>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Target Leverage: '}
                        color={'grey'}
                        margin={'0px 0px 10px 0px'}
                    />
                    <FlexibleRow>
                        <StyleText fontSize={'16px'}
                            fontWeight={'600'}
                            text={'3.0'} />
                        <StyleText fontSize={'16px'}
                            fontWeight={'700'}
                            text={'X'} />
                    </FlexibleRow>
                </Row>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Current Leverage: '}
                        color={'grey'}
                        margin={'0px 0px 10px 0px'}
                    />
                    <FlexibleRow>
                        <StyleText fontSize={'16px'}
                            fontWeight={'600'}
                            text={leverage} />
                        <StyleText fontSize={'16px'}
                            fontWeight={'700'}
                            text={'X'} />
                    </FlexibleRow>
                </Row>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        margin={'0px 0px 10px 0px'}
                        text={'Tokens Outstanding: '}
                        color={'grey'}
                    />
                    <FlexibleRow>
                        <StyleText fontSize={'16px'}
                            fontWeight={'600'}
                            margin={'0 12px 0 0'}
                            text={`${outstanding}`} />
                        <StyleText fontSize={'16px'}
                            fontWeight={'600'}
                            text={`3QLSOL`} />
                    </FlexibleRow>
                </Row>
                <Row marginBottom={"20px"}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Total Fund Value: '}
                        margin={'0px 0px 10px 0px'}
                        color={'grey'}
                    />
                    <FlexibleRow>
                        <StyleText fontSize={'16px'}
                            fontWeight={'600'}
                            margin={'0 12px 0 0'}
                            text={`${totalFund}`} />
                        <StyleText fontSize={'16px'}
                            fontWeight={'600'}
                            text={`USDT`} />
                    </FlexibleRow>
                </Row>
                <Row marginBottom={"20px"}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Basket: '}
                        margin={'0px 0px 10px 0px'}
                        color={'grey'}
                    />
                    <Column>
                        <FlexibleRow>
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                margin={'0 12px 0 0'}
                                text={`${basketPerp}`} />
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                text={`SOL-PERP`} />
                        </FlexibleRow>
                        <FlexibleRow>
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                margin={'0 12px 0 0'}
                                text={`${basketUSDT}`} />
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                text={`USDT`} />
                        </FlexibleRow>
                    </Column>
                </Row>
                <Row>
                    <Button
                        padding={'22px 56px'} margin={'0px 28px 0px 0px'} text={'Rebalancing'} onClick={rebalancing} />
                </Row>
            </Block>
        </Container>
    );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  color: #ffffff;
  
  @media only screen and (max-width: 768px) {
    width: 100%;
  }
`;

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
`;

const FlexibleRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${props => props.marginBottom};
  
  @media only screen and (max-width: 768px) {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.marginBottom};
  width:100%;
  max-width: 480px;
  
  @media only screen and (max-width: 768px) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
`;
const RowTitle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.marginBottom};
  width:100%;
  max-width: 740px;
  
  @media only screen and (max-width: 768px) {
    margin-bottom: ${props => props.marginBottom};
    
    display: flex;
    flex-direction: column;
    width: 100%;
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: left;
  margin-top: ${props => props.marginTop};
  
  @media only screen and (max-width: 768px) {
    width: 100%;
  }
`;

const TokenName = styled.div`
  font-size: 40px;
  font-weight: 700;
`;

const TokenPrice = styled.div`
  font-size: 30px;
  font-weight: 500;
`;

export default MetaData;
