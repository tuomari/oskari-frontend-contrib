import styled from 'styled-components';
import { Radio, InfoIcon } from 'oskari-ui';

export const Content = styled('div')`
    display: flex;
    flex-direction: column;
    margin-right: 10px;
`;

export const RadioGroup = styled(Radio.Group)`
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
`;
export const RadioButton = styled(Radio.Choice)`
    display: flex;
    flex-flow: row nowrap;
    margin-bottom: 10px;
`;

export const Group = styled('div')`
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
`;
export const InlineGroup = styled('div')`
    display: flex;
    flex-flow: row nowrap;
    margin-bottom: 10px;
`;

export const Label = styled('div')`
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    font-weight: bold;
    margin-bottom: 10px;
`;