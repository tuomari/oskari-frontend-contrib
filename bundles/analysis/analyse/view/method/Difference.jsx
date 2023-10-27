import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Controller } from 'oskari-ui/util';
import { Message, Radio } from 'oskari-ui';
import { Content, RadioGroup } from '../styled';
import { InfoIcon } from 'oskari-ui/components/icons';

export const Difference = ({ 
    params,
    controller,
    targetLayer
}) => {
    return (
        <Content>
        </Content>
    );
};

Difference.propTypes = {
    params: PropTypes.object.isRequired,
    controller: PropTypes.instanceOf(Controller).isRequired,
    targetLayer: PropTypes.object
};
