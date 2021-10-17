import React from 'react';
import styled from 'styled-components';

const StyleText = (props) => {
    return (
        <Container fontSize={props.fontSize}
            mobileFontSize={props.mobileFontSize}
            fontWeight={props.fontWeight} margin={props.margin} color={props.color}>
            {props.text}
        </Container>
    );
}

const Container = styled.div`
  font-size: ${props => props.fontSize};
  font-weight: ${props => props.fontWeight};
  margin: ${props => props.margin};
  color: ${props => props.color};
  
  @media only screen and (max-width: 768px) {
    font-size: ${props => props.mobileFontSize};
    margin-bottom: 10px;
  }
`;

export default StyleText;
