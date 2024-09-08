/**
 * This file contains the InterLinearComponent.
 */
import React, { ReactElement, Fragment, useRef, useState, useMemo, useEffect } from 'react';
import { Grid, Typography } from '@mui/material';
import { AlignmentSide } from '../../common/data/project/corpus';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { CorpusContainer, Verse } from '../../structs';
import { VerseDisplay } from '../corpus/verseDisplay';
import { WordDisplayVariant } from '../wordDisplay';

export interface InterLinearComponent {
  viewCorpora: CorpusContainer;
  viewportIndex: number;
  position: BCVWP | null;
  containers: {
    sources?: CorpusContainer,
    targets?: CorpusContainer
  };
  visibleVerses: Verse[];
  setVisibleVerses: React.Dispatch<React.SetStateAction<Verse[]>>;
}

const determineInterLinearView = async (
  viewCorpora: CorpusContainer,
  verses: Verse[],
  bcvId: BCVWP | null,
  isCitationVisible: boolean,
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
            sx={{ p: '1px', width: '53px', height: '16px', justifyContent: 'center', marginTop: '20px'}}
            display={'flex'}
          >
            <Typography
              sx={
                bcvId?.matchesTruncated(verse.bcvId, BCVWPField.Verse)
                  ? { fontStyle : 'italic' }
                  : {}
              }
            >
              {isCitationVisible? verse.citation : ""}
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

export const InterLinearComponent = ({viewCorpora,
                                       viewportIndex,
                                       position,
                                       containers, setVisibleVerses, visibleVerses}: InterLinearComponent): ReactElement => {
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [verseElement, setVerseElement] = useState<JSX.Element[]>();
  const [verseElementBottom, setVerseElementBottom] = useState<JSX.Element[]>();

  const computedPosition = useMemo(() => {
    if (viewCorpora.id === AlignmentSide.TARGET) {
      return position ?? null;
    }
    // displaying source
    if (!position || !containers.targets) return null;
    const verseString = containers.targets.verseByReference(position)?.sourceVerse;
    if ((verseString ?? '').trim().length) return BCVWP.parseFromString(verseString!);
    return position;
  }, [viewCorpora.id, position, containers.targets]);

  const verseAtPosition: Verse | undefined = useMemo(
    () =>
      computedPosition
        ? viewCorpora.verseByReference(computedPosition)
        : undefined,
    [computedPosition, viewCorpora]
  );

  const initialVerses = useMemo(() => {
    if (!computedPosition || !viewCorpora) return [];
    const verse = viewCorpora.verseByReference(computedPosition);
    if (!verse) return [];
    return [verse].filter((v) => v);
  }, [viewCorpora, computedPosition]);

  const verseKeys = useMemo(
    () =>
      viewCorpora.corpora
        .flatMap((corpus) => Object.keys(corpus.wordsByVerse))
        .sort(),
    [viewCorpora.corpora]
  );

  useEffect(() => setVisibleVerses(initialVerses), [initialVerses]);

  useEffect(() => {
    //top
    determineInterLinearView(
      viewCorpora,
      visibleVerses,
      computedPosition, true)
      .then(verseElement => setVerseElement(verseElement));
    //bottom
    determineInterLinearView(
      viewCorpora,
      visibleVerses,
      computedPosition, false)
      .then(verseElement => setVerseElementBottom(verseElement));
  }, [computedPosition, viewCorpora, visibleVerses, verseAtPosition]);

  return (
    <Fragment>

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
      <Grid
        container
        sx={{ pl: 4, flex: 8, overflow: 'auto' }}
      >
        {
          (verseElementBottom?.length ?? 0) > 0
            ? verseElementBottom
            : <Typography>No verse data for this reference.</Typography>
        }
      </Grid>
    </Fragment>
  );
};

export default InterLinearComponent;
