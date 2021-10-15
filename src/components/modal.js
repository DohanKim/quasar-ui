import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Close from "./close";

const Modal = ({ className,
                 visible,
                 children,
                 onClose,
                 width,
                 height,
                 maskClosable,
                 closable}) => {
  const onMaskClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose(e);
    }
  }

  const close = (e) => {
    if (onClose) {
      onClose(e);
    }
  }
  return (
    <>
      <ModalOverlay visible={visible} />
      <ModalWrapper className={className} tabIndex="-1" visible={visible}>
        <ModalInner tabIndex="0" className="modal-inner" width={width} height={height}>
          {/*{closable && <button className="modal-close" onClick={close} />}*/}
          <Right>
            { closable && <Close onClick={close} />}
          </Right>
          { children }
        </ModalInner>
      </ModalWrapper>
    </>
  );
}

Modal.propTypes = {
  visible: PropTypes.bool,
}

const ModalWrapper = styled.div`
  box-sizing: border-box;
  display: ${(props) => (props.visible ? 'block' : 'none')};
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  color: #fff;
  overflow: auto;
  outline: 0;
`;

const ModalOverlay = styled.div`
  box-sizing: border-box;
  display: ${(props) => (props.visible ? 'block' : 'none')};
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 999;
`;

const ModalInner = styled.div`
  box-sizing: border-box;
  position: relative;
  box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.5);
  background-color: #13111a;
  border-radius: 10px;
  width: ${props => props.width};
  height: ${props => props.height};
  max-width: 480px;
  top: 50%;
  transform: translateY(-50%);
  margin: 0 auto;
  padding: 40px 20px;
`;

const Right = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

export default Modal;
