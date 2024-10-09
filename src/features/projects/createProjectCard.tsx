import React from 'react';
import { Card, CardActionArea, CardContent, Grid } from '@mui/material';
import ProjectSettings from './projectSettings';
import { LibraryAdd } from '@mui/icons-material';
import {
  projectCardHeight,
  projectCardMargin,
  projectCardWidth
} from './styleConstants';

/**
 * card component which allows users to create projects
 * @param onClick action performed when the card is clicked
 * @param unavailableProjectNames project names that can't be used because they already exist
 * @param open if the project settings display is open (in this case, the project creation display)
 * @param closeCallback callback when the creation display is dismissed
 * @param isSignedIn whether the user is currently signed in
 */
export const CreateProjectCard: React.FC<{
  onClick?: (e: React.MouseEvent) => void,
  unavailableProjectNames?: string[],
  open: boolean,
  closeCallback: () => void,
  isSignedIn: boolean
}> = ({ onClick, unavailableProjectNames, open, closeCallback, isSignedIn }) => {
  const cardContents: JSX.Element = (
    <CardContent
      id={'create-card-content'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyItems: 'center',
        alignItems: 'center',
        height: '100%',
        margin: projectCardMargin
      }}>
      {open ?
        <ProjectSettings closeCallback={closeCallback} isSignedIn={isSignedIn}
                         unavailableProjectNames={unavailableProjectNames} projectId={null} />
        :
        <Grid container justifyContent="center" alignItems="center" sx={{
          height: '100%',
          margin: '0 auto'
        }}>
          <LibraryAdd color={'primary'} />
        </Grid>}
    </CardContent>);
  return (<>
    <Card
      variant={'outlined'}
      sx={theme => ({
        width: projectCardWidth,
        height: projectCardHeight,
        m: '3px',
        backgroundColor: theme.palette.primary.contrastText,
        position: 'relative'
      })}>
      {open
        ? <>
          {cardContents}
        </>
        : <CardActionArea
          sx={{
            width: '100%',
            height: '100%'
          }}
          onClick={(e) => onClick?.(e)}>
          {cardContents}
        </CardActionArea>
      }
    </Card>
  </>);
};
