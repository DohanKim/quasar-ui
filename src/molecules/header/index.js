import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import logo from '../images/logo.png';
import Button from "../../components/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import ConnectWalletButton from '../../bu-components/ConnectWalletButton';

import { abbreviateAddress } from '../../utils';

const Header = (props) => {
    const { isWalletConnected, wallet } = props
    console.log(wallet)
    return (
        <Container>
            <div>
                <img src={logo} width={148} />
            </div>
            <div>
                <WalletMultiButton style={{ backgroundColor: "transparent", padding: "0" }}>
                    <Button text={isWalletConnected ? abbreviateAddress(wallet.publicKey) : 'Connect Wallet'} padding={'15px 28px'} />
                </WalletMultiButton>
            </div>
        </Container>
    );
}

export default Header;

const Container = styled.div`
  position: absolute;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 40px 24px 0px 24px;
  z-index: 99;
  box-sizing: border-box;
`;
