import React, { useState } from "react";
import styled from 'styled-components';
import Button from "../../components/button";
import Tag from "../../components/tag";
import GreyButton from "../../components/greyButton";
import StyleText from "../../components/styleText";
import Modal from "../../components/modal";
import InputText from "../../components/inputText";
import MintLeverageTokenForm from "../../bu-components/MintLeverageTokenForm";

const Mint = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  }

  const closeModal = () => {
    setModalVisible(false);
  }

  return (
    <Container>
      {
        modalVisible && <Modal
          visible={modalVisible}
          closable={true}
          maskClosable={true}
          onClose={closeModal}>
          <InputText /> 3x Sol
        </Modal>
      }
      <Row marginBottom={'40px'}>
        <StyleText fontSize={'44px'} fontWeight={'700'} text={'Mint Tokens'} />
      </Row>
      <Block>
        <Row marginBottom={'20px'}>
          <StyleText fontSize={'40px'}
            fontWeight={'700'}
            text={'sSOL x3 Token'} />
        </Row>
        <MintLeverageTokenForm />
        <Row marginBottom={'40px'}>
          <StyleText fontSize={'30px'}
            margin={"0 20px 0 0"}
            fontWeight={'500'}
            text={'$ 230.24'} />
          <Tag color={'#46BD77'} text={'+ 10%'} />
        </Row>
        <Row>
          <Button text={'Mint sSOL x3 for USDT'}
            onClick={openModal}
            padding={'22px 56px'} margin={'0px 28px 0px 0px'} />
          <GreyButton text={'Burn'} padding={'22px 56px'} />
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

const TokenName = styled.div`
  font-size: 40px;
  font-weight: 700;
`;

const TokenPrice = styled.div`
  font-size: 30px;
  font-weight: 500;
`;

export default Mint;
