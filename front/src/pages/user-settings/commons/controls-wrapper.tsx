import styled from '../../../util/styled';
import { borderColor } from './button';

/**
 * Wrapper of a set of controls.
 */
export const ControlsWrapper = styled.div`
  margin: 1em 0;
  border: 1px solid ${borderColor};
  padding: 8px;
`;

/**
 * Description of set of controls.
 */
export const ControlsDescription = styled.p`
  margin: 0.2em 0;
  color: #444444;
  font-size: 0.9em;
`;

/**
 * Title of set of controls.
 */
export const ControlsName = styled.div`
  margin: 0 0 0.2em 0;
  font-weight: bold;
`;
