import React from "react";
import styled from 'styled-components';
import Button from "../../components/button";
import Tag from "../../components/tag";
import GreyButton from "../../components/greyButton";
import StyleText from "../../components/styleText";

import useQuasarStore from '../../stores/useQuasarStore'

const MetaData = () => {
    const [leverage, setLeverage] = React.useState(3.02);
    const [basketPerp, setBasketPerp] = React.useState(12)
    const [basketUSDT, setBasketUSDT] = React.useState(12000)
    const [outstanding, setOutstanding] = React.useState(12000)
    const [totalFund, setTotalFund] = React.useState(12000)
    const [tokenPrice, setTokenPrice] = React.useState(234.4)

    const quasarClient = useQuasarStore((s) => s.connection.client)
    const quasarGroup = useQuasarStore((s) => s.quasarGroup)
    const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
    const connection = useQuasarStore((s) => s.connection.current)


    React.useEffect(() => {
        const changeTokenBalance = (Math.random() * 3).toFixed(8);
        setInterval(() => {
            const random = parseInt(Math.random() * 10)
            const delta = Math.random() * 2
            if (random % 2 === 0) {
                setTokenPrice(price => parseFloat(price) + parseFloat(delta))
            } else {
                setTokenPrice(price => parseFloat(price) - parseFloat(delta))
            }
            calculatingValue(changeTokenBalance)


        }, 15000)
    }, [])

    const calculatingValue = (changeTokenBalance) => {
        calcLeverage(changeTokenBalance)
        calcBasketPerp(changeTokenBalance)
        calcBasketUSDT(changeTokenBalance)
        calcOutstanding(changeTokenBalance)
        calcTotalFund(changeTokenBalance)
    }

    const calcLeverage = (changeTokenBalance) => {
        const random = parseInt(Math.random() * 10)
        const delta = Math.random()
        if (random % 2 === 0) {
            setLeverage(leverage => (parseFloat(leverage) + parseFloat(delta)).toFixed(2))
        } else {
            setLeverage(leverage => (parseFloat(leverage) - parseFloat(delta)).toFixed(2))
        }
    }

    const calcBasketPerp = (changeTokenBalance) => {
        setBasketPerp(basketPerp => parseFloat(parseFloat(basketPerp) + parseFloat(changeTokenBalance)).toFixed(4))
    }

    const calcBasketUSDT = (changeTokenBalance) => {
        setBasketUSDT(basketUSDT => parseFloat(parseFloat(basketUSDT) + (parseFloat(changeTokenBalance) * parseFloat(tokenPrice))).toFixed(4))
    }

    const calcOutstanding = (changeTokenBalance) => {
        setOutstanding(outstanding => parseFloat(parseFloat(outstanding) + parseFloat(changeTokenBalance)).toFixed(4))
    }

    const calcTotalFund = (changeTokenBalance) => {
        setTotalFund(totalFund => parseFloat(parseFloat(totalFund) + parseFloat(changeTokenBalance)).toFixed(4))
    }

    const rebalancing = () => {
        calculatingValue(3)
    }

    return (
        <Container>
            <RowTitle marginBottom={'40px'}>
                <StyleText fontSize={'44px'}
                           mobileFontSize={'30px'}
                           fontWeight={'700'}
                           text={'3X Long Solana Token'} />
            </RowTitle>
            <Block>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Target Leverage: '}
                        color={'grey'}
                        margin={'0px 0px 10px 0px'}
                    />
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'3.0'} />
                </Row>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Current Leverage: '}
                        color={'grey'}
                        margin={'0px 0px 10px 0px'}
                    />
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={leverage} />
                </Row>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        margin={'0px 0px 10px 0px'}
                        text={'Tokens Outstanding: '}
                        color={'grey'}
                    />
                    <Column>
                        <Row>
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                margin={'0 12px 0 0'}
                                text={`${outstanding}`} />
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                text={`3QLSOL`} />
                        </Row>
                    </Column>
                </Row>
                <Row marginBottom={"20px"}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Total Fund Value: '}
                        margin={'0px 0px 10px 0px'}
                        color={'grey'}
                    /><Column>
                        <Row>
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                margin={'0 12px 0 0'}
                                text={`${totalFund}`} />
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                text={`USDT`} />
                        </Row>
                    </Column>
                </Row>
                <Row marginBottom={"20px"}>
                    <StyleText fontSize={'16px'}
                        fontWeight={'600'}
                        text={'Basket: '}
                        margin={'0px 0px 10px 0px'}
                        color={'grey'}
                    />
                    <Column>
                        <Row>
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                margin={'0 12px 0 0'}
                                text={`${basketPerp}`} />
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                text={`SOL-PERP`} />
                        </Row>
                        <Row>
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                margin={'0 12px 0 0'}
                                text={`${basketUSDT}`} />
                            <StyleText fontSize={'16px'}
                                fontWeight={'600'}
                                text={`USDT`} />
                        </Row>
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
`;

const Block = styled.div`
  display: flex;
  flex-direction: column;
  padding: 40px;
  margin-bottom: 100px;
  border-radius: 20px;
  align-items: flex-start;
  background-color: hsla(0, 0%, 100%, 0.06);
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
  }
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: left;
  margin-top: ${props => props.marginTop};
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
