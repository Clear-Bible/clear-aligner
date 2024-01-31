import React, { useMemo, useState } from 'react';
import BCVNavigation, { BCVNavigationProps } from './BCVNavigation';
import { Meta } from '@storybook/react';
import BCVWP from '../bcvwp/BCVWPSupport';
import bcvNavigationSampleTargetWordsData from './bcvNavigationSampleTargetWordsData.json';
import { Word } from '../../structs';

const meta: Meta<typeof BCVNavigation> = {
  title: 'BCVNavigation',
  component: BCVNavigation,
};

export default meta;

export const Default = (props: BCVNavigationProps) => (
  <BCVNavigation {...props} />
);
Default.args = {
  words: [
    {
      id: '45005003001',
    },
    {
      id: '48006002001',
    },
  ],
} as BCVNavigationProps;

export const Horizontal = (props: BCVNavigationProps) => (
  <BCVNavigation {...props} />
);
Horizontal.args = {
  horizontal: true,
  words: bcvNavigationSampleTargetWordsData as Word[],
} as BCVNavigationProps;

export const Disabled = (props: BCVNavigationProps) => (
  <BCVNavigation {...props} />
);
Disabled.args = {
  disabled: true,
  words: [
    {
      id: '45005003001',
    },
    {
      id: '48006002001',
    },
  ],
} as BCVNavigationProps;

export const WithCurrentPositionAtGalatians6_2 = ({
  words,
  onNavigate,
  currentPosition,
}: BCVNavigationProps) => {
  const [currentPositionState, setCurrentPositionState] =
    useState(currentPosition);
  const currentPositionDelegate = useMemo(
    () => (currentPosition: BCVWP) => {
      setCurrentPositionState(currentPosition);
      onNavigate?.(currentPosition);
    },
    [onNavigate, setCurrentPositionState]
  );
  return (
    <BCVNavigation
      words={words}
      currentPosition={currentPositionState}
      onNavigate={currentPositionDelegate}
    />
  );
};
WithCurrentPositionAtGalatians6_2.args = {
  horizontal: true,
  words: bcvNavigationSampleTargetWordsData,
  currentPosition: new BCVWP(1, 1, 31),
} as BCVNavigationProps;
