import React from "react";
import styled from 'styled-components';

const GreyButton = (props) => {
    return (
        <Container padding={props.padding}>
            {props.text}
        </Container>
    );
}

const Container = styled.div`
  background-color: #302c3f;
  padding: ${props => props.padding};
  border-radius: 1000px;
`;

export default GreyButton;
