import React from "react";
import styled, { keyframes } from "styled-components";
import Mint from "./molecules/mint";
import MetaData from "./molecules/metaData";
import MintButton from "./molecules/mintButton";
import TokenList from "./components/TokenList";

const Main = () => {
    return (
        <AnimationBackground>
            <Container>
                <MetaData />
                <MintButton />
                {/*<Mint />*/}
                {/* <Exchange /> */}
            </Container>
        </AnimationBackground>
    );
}

const AnimationBackground = styled.div`
  display: block;
  position: relative;
`;

const Container = styled.div`
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding-top: 120px;
  padding-left: 24px;
  padding-right: 24px;
`;

export default Main;
