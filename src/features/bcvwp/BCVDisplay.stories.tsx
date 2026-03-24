/**
 * This file contains the logic to use the BCVDisplay component in Storybook
 */

import React from 'react';
import { Meta } from '@storybook/react';
import { BCVDisplay, BCVDisplayProps } from './BCVDisplay';
import BCVWP from './BCVWPSupport';

const meta: Meta<typeof BCVDisplay> = {
  title: 'BCVDisplay',
  component: BCVDisplay,
};

export default meta;

export const NothingSelected = (props: BCVDisplayProps) => (
  <BCVDisplay {...props} />
);
NothingSelected.args = {
  currentPosition: undefined,
} as BCVDisplayProps;

export const WithCurrentPositionData = (props: BCVDisplayProps) => (
  <BCVDisplay {...props} />
);
WithCurrentPositionData.args = {
  currentPosition: new BCVWP(43, 3, 16),
} as BCVDisplayProps;
