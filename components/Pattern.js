import React from "react";
import styled from "styled-components";

const Pattern = () => <StyledPattern />;

const StyledPattern = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-color: #000;
  background-image: radial-gradient(rgba(103, 232, 249, 0.4) 10%, transparent 10%);
  background-size: 11px 11px;

  /* Fade out smoothly after 50% from top */
  mask-image: linear-gradient(to bottom, #000 50%, transparent 100%);
  mask-size: 100% 60%;
  mask-repeat: no-repeat;

  -webkit-mask-image: linear-gradient(to bottom, #000 50%, transparent 100%);
  -webkit-mask-size: 100% 60%;
  -webkit-mask-repeat: no-repeat;

  opacity: 0.6;
`;

export default Pattern;
