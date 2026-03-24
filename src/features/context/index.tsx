import { ReactElement } from 'react';

import useDebug from 'hooks/useDebug';
import { useAppSelector } from 'app/hooks';

import cssVar from 'styles/cssVar';
import { grey } from '@mui/material/colors';

interface TextProps {
  anteText: string;
  text: string;
  postText: string;
  name: string;
}

export const Context = (props: TextProps): ReactElement => {
  useDebug('ContextComponent');

  const theme = useAppSelector((state) => {
    return state.app.theme;
  });

  return (
    <div>
      <div
        style={{
          textAlign: 'right',
          padding: '0.7rem',
          paddingBottom: '0rem',
          color: cssVar('font-color', theme),
        }}
      >
        {props.name}
      </div>
      <p
        style={{
          paddingBottom: '0.5rem',
          paddingLeft: '0.7rem',
          paddingRight: '0.7rem',
          color: cssVar('font-color', theme),
        }}
      >
        <span>{props.anteText}</span>
        <span> </span>
        <span
          style={{
            backgroundColor: grey['600'],
            color: cssVar('font-color', theme),
          }}
        >
          {props.text}
        </span>
        <span> </span>
        <span>{props.postText}</span>
      </p>
    </div>
  );
};

export default Context;
