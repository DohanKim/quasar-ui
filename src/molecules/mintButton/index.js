import React, { useState } from "react";
import styled from 'styled-components';
import Button from "../../components/button";
import Tag from "../../components/tag";
import GreyButton from "../../components/greyButton";
import StyleText from "../../components/styleText";
import Modal from "../../components/modal";
import InputText from "../../components/inputText";

import useQuasarStore from '../../stores/useQuasarStore'

import { Keypair, PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { I80F48 } from '@blockworks-foundation/mango-client'
import { mangoProgramId } from '../../stores/useQuasarStore'
import { notify } from '../../utils/notifications'
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    Token,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import useHydrateStore from "../../hooks/useHydrateStore";
import useWallet from "../../hooks/useWallet";

const MintButton = () => {
    useHydrateStore()
    const { wallet } = useWallet()
    const quasarClient = useQuasarStore((s) => s.connection.client)
    const quasarGroup = useQuasarStore((s) => s.quasarGroup)
    const mangoGroup = useQuasarStore((s) => s.selectedMangoGroup.current)
    const connection = useQuasarStore((s) => s.connection.current)

    const [tokenMint, setTokenMint] = useState()
    const [quantity, setQuantity] = useState(0.1)

    const handleTextChange =
        (setFn) =>
            ({ target: { value } }) =>
                setFn(value)

    const mintLeverageToken = async () => {
        // const wallet = useQuasarStore.getState().wallet.current
        const quasarGroup = await quasarClient.getQuasarGroup(new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'))
        console.log(mangoGroup)

        try {
            const tokenMintPk = new PublicKey(quasarGroup.leverageTokens[0].mint)
            const quoteTokenMint = new PublicKey(
                'So11111111111111111111111111111111111111112',
            )
            const leverageTokenIndex =
                quasarGroup.getLeverageTokenIndexByMint(tokenMintPk)
            const quoteTokenIndex = mangoGroup.getTokenIndex(quoteTokenMint)

            const leverageToken = await quasarClient.mintLeverageToken(
                quasarGroup.publicKey,
                new PublicKey(quasarGroup.leverageTokens[0].mint),
                mangoProgramId,
                mangoGroup.publicKey,
                quasarGroup.leverageTokens[leverageTokenIndex].mangoAccount,
                wallet,
                mangoGroup.mangoCache,
                mangoGroup.tokens[quoteTokenIndex].rootBank,
                mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBanks[0],
                mangoGroup.rootBankAccounts[quoteTokenIndex].nodeBankAccounts[0].vault,
                quasarGroup.signerKey,
                new BN(quantity),
            )
            notify({
                title: 'leverage token minted',
            })

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

    const getQuasarGroup = async () => {
        const quasarGroup = await quasarClient.getQuasarGroup(new PublicKey('4G5bLXpLCZXJjrT6SQwhjQkXzKYKAEQ12TsiCt52tTmo'))
        console.log(quasarGroup.leverageTokens[0].mint)
    }

    return (
        <Container>
            <Row marginBottom={'40px'}>
                <StyleText fontSize={'44px'} fontWeight={'700'} text={'Mint Tokens'} />
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
                <Row>
                    <Button text={'Mint sSOL x3 for USDT'}
                        onClick={mintLeverageToken}
                        padding={'22px 56px'} margin={'0px 28px 0px 0px'} />
                    <GreyButton onClick={getQuasarGroup} text={'Burn'} padding={'22px 56px'} />
                </Row>
            </Block>
        </Container>
    )
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


export default MintButton
