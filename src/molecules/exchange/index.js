import React from "react";
import styled from 'styled-components';
import Tag from "../components/tag";
import StyleText from "../components/styleText";
import InputText from "../components/inputText";
import Button from "../components/button";

const Exchange = () => {
    return (
        <Container>
            <Row marginBottom={'40px'}>
                <StyleText fontSize={'44px'} fontWeight={'700'} text={'Exchange'} />
            </Row>
            <Block>
                <Row marginBottom={'20px'}>
                    <StyleText fontSize={'40px'}
                        fontWeight={'700'}
                        text={'sSOL x3 Token'} />
                </Row>
                <Row marginBottom={'40px'}>
                    <StyleText fontSize={'30px'}
                        margin={"0 20px 0 0"}
                        fontWeight={'500'}
                        text={'$ 230.24'} />
                    <Tag color={'#46BD77'} text={'+ 10%'} />
                </Row>
                <Col marginBottom={'40px'}>
                    <StyleText fontSize={'18px'}
                        fontWeight={'700'}
                        margin={'0px 0px 20px 0px'}
                        text={'Price'} />
                    <InputText width={'400px'} height={'60px'} />
                    <StyleText fontSize={'18px'}
                        fontWeight={'700'}
                        margin={'40px 0px 20px 0px'}
                        text={'Amount'} />
                    <InputText width={'400px'} height={'60px'} />
                </Col>
                <Row>
                    <Button text={"Buy"} padding={"22px 56px"} margin={"0 40px 0 0"} />
                    <Button text={"Sell"} padding={"22px 56px"} />
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
  justify-content: flex-start;
  align-items: center;
  margin-bottom: ${props => props.marginBottom};
`;

const Col = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.marginBottom};
`;

export default Exchange;
