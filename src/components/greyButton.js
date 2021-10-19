import React from "react";
import styled from 'styled-components';

const GreyButton = (props) => {
    return (
        <Container padding={props.padding}
                   onClick={props.onClick}
                   margin={props.margin}>
            {props.text}
        </Container>
    );
}

const Container = styled.div`
  background-color: #302c3f;
  padding: ${props => props.padding};
  margin: ${props => props.margin};
  border-radius: 1000px;
  cursor: pointer;
  
  @media only screen and (max-width: 768px) {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
`;

export default GreyButton;
