import { SxProps, Theme } from '@mui/material';
import { projectCardMargin } from '../../features/projects/styleConstants';

export default {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  paddingTop: '8px',
  paddingBottom: projectCardMargin,
  paddingLeft: projectCardMargin
} as SxProps<Theme>;
