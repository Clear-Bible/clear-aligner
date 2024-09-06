/**
 * This file contains the CorpusComponent which is used in the Alignment editor
 * to display the current verse and related functionality/context
 */
import React, { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Grid, IconButton, Tooltip, Typography } from '@mui/material';
import { Add, InfoOutlined, Remove } from '@mui/icons-material';
import useDebug from 'hooks/useDebug';
import { CorpusContainer, Verse } from 'structs';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { VerseDisplay } from './verseDisplay';
import {
  computeAvailableChaptersAndVersesFromNavigableBooksAndPosition,
  findNextNavigableVerse,
  findPreviousNavigableVerse,
  getReferenceListFromWords
} from '../bcvNavigation/structs';
import { AlignmentSide } from '../../common/data/project/corpus';
import { WordDisplayVariant } from '../wordDisplay';
import useCorpusActionControls from '../../hooks/useCorpusActionControls';

export interface CorpusProps {
  viewCorpora: CorpusContainer;
  viewportIndex: number;
  position: BCVWP | null;
  containers: {
    sources?: CorpusContainer,
    targets?: CorpusContainer
  };
  isLiveInterLinear?: boolean
}

const determineCorpusView = async (
  viewCorpora: CorpusContainer,
  verses: Verse[],
  bcvId: BCVWP | null
) => {

  return verses.map((verse) => {
    const languageInfo = viewCorpora.languageAtReferenceString(verse.bcvId.toReferenceString());
    return (
      <Grid
        container
        key={`${viewCorpora.id}/${verse.bcvId.toReferenceString()}`}
        sx={{ marginRight: '.7em' }}
        flexDirection={languageInfo?.textDirection === 'ltr' ? 'row' : 'row-reverse'}  //direction set by languageInfo
      >
        <Grid
          item xs={1}
          sx={{ p: '1px', width: '53px', height: '16px'}}
        >
          <Typography
            sx={
              bcvId?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
                ? { fontWeight: '700', fontSize: '14px', paddingTop: '20px' }
                : {}
            }
          >
            {verse.citation}
          </Typography>
        </Grid>
        <Grid item xs={11}>
          <Grid
            container
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              ...(languageInfo?.textDirection
                ? { direction: languageInfo?.textDirection }
                : {})
            }}
          >
            <Typography
              component={'span'}
              lang={languageInfo?.code}
              style={{
                paddingBottom: '0.5rem',
              }}
            >
              <VerseDisplay corpus={viewCorpora.corpusAtReferenceString(verse.bcvId.toReferenceString())}
                            verse={verse}
                            variant={WordDisplayVariant.BUTTON}
                            allowGloss />
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

export const CorpusComponent = (props: CorpusProps): ReactElement => {
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const { viewCorpora, containers } = props;
  const [verseElement, setVerseElement] = useState<JSX.Element[]>();

  useDebug('CorpusComponent');

  const [addBcvId, removeBcvId, corpusActionEnableState, computedPosition, visibleVerses, verseAtPosition] = useCorpusActionControls(viewCorpora, containers, props)

  useEffect(() => {
  determineCorpusView(
    viewCorpora,
    visibleVerses,
    computedPosition)
    .then(verseElement => setVerseElement(verseElement));
}, [computedPosition, viewCorpora, visibleVerses, verseAtPosition]);

  if (!viewCorpora) {
    return <Typography>Empty State</Typography>;
  }

  return (
    <Grid
      container
      flexDirection="column"
      justifyContent="space-between"
      sx={{ height: '100%', flex: 1 }}
    >
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ py: 1, px: 2 }}
      >
        {!props.isLiveInterLinear &&
        <>
          <Grid container sx={{ flex: 1 }}>
            <CorpusAction
              add={addBcvId}
              remove={removeBcvId}
              disabled={corpusActionEnableState}
            />
          </Grid>
          <Grid
            container
            justifyContent="flex-end"
            alignItems="center"
            sx={{ flex: 1 }}
          >
            <Typography variant="h6" sx={{ mr: 1 }}>
              {computedPosition ? viewCorpora.corpusAtReferenceString(computedPosition.toReferenceString())?.name : ''}
            </Typography>

            <Tooltip
              title={
                <>
                  <Typography variant="h6">
                    {computedPosition
                      ? viewCorpora.corpusAtReferenceString(computedPosition.toReferenceString())?.fullName
                      : ''}
                  </Typography>
                  <Typography>
                    {computedPosition
                      ? viewCorpora.corpusAtReferenceString(computedPosition.toReferenceString())?.name
                      : ''}
                  </Typography>
                  <Typography>
                    Language:{' '}
                    {computedPosition
                      ? viewCorpora.languageAtReferenceString(computedPosition.toReferenceString())?.code
                      : ''}
                  </Typography>
                </>
              }
            >
              <InfoOutlined />
            </Tooltip>
          </Grid>
        </>
      }
      </Grid>
      <Grid
        ref={textContainerRef}
        container
        sx={{ pl: 4, flex: 8, overflow: 'auto' }}
      >
        {
          (verseElement?.length ?? 0) > 0
            ? verseElement
            : <Typography>No verse data for this reference.</Typography>
        }
      </Grid>
    </Grid>
  );
};

interface CorpusActionProps {
  add: () => void;
  remove: () => void;
  disabled?: 'add' | 'remove' | null;
}

const CorpusAction: React.FC<CorpusActionProps> = ({
                                                     add,
                                                     remove,
                                                     disabled
                                                   }) =>
  (
    <Grid container>
      <Tooltip title="Show the next verses" placement="left">
        <span>
          <IconButton onClick={add} disabled={disabled === 'add'}>
            <Add sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Remove the outer verses" placement="right">
        <span>
          <IconButton onClick={remove} disabled={disabled === 'remove'}>
            <Remove sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Grid>
  );

export default CorpusComponent;
