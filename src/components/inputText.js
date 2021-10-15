import React from "react";
import styled from "styled-components";

const InputText = (props) => {
    return (
        <Input type="text"
               width={props.width}
               height={props.height}
               maxlength={"256"}
               onChange={props.onChange} />
    )
}

const Input = styled.input`
  width: ${props => props.width};
  height: ${props => props.height};
  border-style: solid;
  border-width: 3px;
  border-color: hsla(0, 0%, 100%, 0.3);
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 8px 12px;
  color: #fff;
  font-size: 24px;
`;

export default InputText;
