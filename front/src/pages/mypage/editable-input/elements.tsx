import styled from '../../../util/styled';
import {
  smallTextSize,
  formComponentsVerticalMergin,
} from '../../../common/style';
import { helperTextColor } from '../../../common/color';

export const EditableInputs = styled.div`
  color: ${helperTextColor};
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: ${formComponentsVerticalMergin};
`;

export const InputLabel = styled.label`
  font-size: ${smallTextSize};
  line-height: 1.8;
`;

export const InputContent = styled.span`
  padding: 3px;
`;

export const Input = styled.input`
  box-sizing: border-box;
  width: fill-available;
  width: stretch;
  padding: 2px;
  display: grid;
  &[readonly] {
    border-color: transparent;
    color: black;
    background-color: #e6e6e6;
  }
`;
