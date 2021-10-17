import React from "react";
import styled from 'styled-components';

const Tag = (props) => {
    return (
        <Container color={props.color}>
            {props.text}
        </Container>
    );
}

const Container = styled.div`
  background-color: ${props => props.color};
  border-radius: 10px;
  padding: 6px 10px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  
  @media only screen and (max-width: 768px) {
    margin-top: 10px;
  }
`;

export default Tag;
