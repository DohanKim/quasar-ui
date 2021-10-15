import React from "react";
import styled from 'styled-components';

const Button = (props) => {
    return (
        <Container margin={props.margin} onClick={props.onClick}>
            <Inner padding={props.padding}>
                {props.text}
            </Inner>
        </Container>
    );
}

const Container = styled.button`
    display: inline-block;
    margin: ${props => props.margin};
    padding: 2px;
    border-radius: 10000px;
    box-shadow: 0 3px 7px 0 rgb(19 17 26 / 14%);
    transform: scale3d(1, 1, 1.01);
    transition: transform 300ms ease, -webkit-transform 300ms ease;
    transform-style: preserve-3d;
    background-image: linear-gradient(90deg, #ff6f6f, #cec372 37%, #75ffd3 67%, #a72dff);
`;

const Inner = styled.div`
  border-radius: 1000px;
  background-color: #13111a;
  color: #fff;
  line-height: 1.111em;
  font-weight: 700;
  text-align: center;
  letter-spacing: 0.01em;
  padding: ${props => props.padding};
    
  display: inline-block;
  border: 0;
  text-decoration: none;
  cursor: pointer;
`;

export default Button;
