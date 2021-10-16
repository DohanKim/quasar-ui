import React from "react";
import styled from "styled-components";
const Close = (props) => {
  return (
    <Container onClick={props.onClick}>
      X
    </Container>
  );
}

const Container = styled.div`
  color: #fff;
  cursor: pointer;
`;

export default Close;
