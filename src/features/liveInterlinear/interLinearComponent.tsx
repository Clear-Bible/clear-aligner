/**
 * This file contains the InterLinearComponent.
 */
import React, { Fragment, ReactElement, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Grid, Stack, Typography } from '@mui/material';
import { AlignmentSide } from '../../common/data/project/corpus';
import BCVWP, { BCVWPField } from '../bcvwp/BCVWPSupport';
import { CorpusContainer, Verse, Word } from '../../structs';
import { VerseDisplay } from '../corpus/verseDisplay';
import { WordDisplayVariant } from '../wordDisplay';
import { LinksTable } from '../../state/links/tableManager';
import { AppContext } from '../../App';

export interface InterLinearComponentProps {
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

const createInterLinearMap = async (linksTable: LinksTable, verses: Verse[], targetContainer: CorpusContainer): Promise<Map<string, Word[]>> => {
  const result = new Map<string, Word[]>()

  for(const verse of verses) {
    const bcvId = verse.bcvId;
    const links = await linksTable.findByBCV(AlignmentSide.SOURCE, bcvId.book!, bcvId.chapter!, bcvId.verse!); //database query
    for(const link of links){
      for(const sourceWordId of link.sources) {
        const targetWords = result.get(sourceWordId) ?? [];
        for (const targetWordId of link.targets) {
          const targetWord = targetContainer.wordByReferenceString(targetWordId);
          if (targetWord){
            targetWords.push(targetWord)
          }
        }
        if(targetWords.length > 0){
          result.set(sourceWordId, targetWords);
        }
      }
    }
  }
  console.log('result: ', result)
  return result;
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
              <Stack direction={'row'}>
                <VerseDisplay corpus={viewCorpora.corpusAtReferenceString(verse.bcvId.toReferenceString())}
                              verse={verse}
                              variant={WordDisplayVariant.BUTTON}
                              allowGloss
                              isPartOfInterlinear={true}
                />
              </Stack>
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    );
  });
};

const InterLinearComponent = ({viewCorpora,
                                       viewportIndex,
                                       position,
                                       containers, setVisibleVerses, visibleVerses}: InterLinearComponentProps): ReactElement => {
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const [verseElement, setVerseElement] = useState<JSX.Element[]>();
  const [verseElementBottom, setVerseElementBottom] = useState<JSX.Element[]>();
  const { projectState } = useContext(AppContext);
  const [wordMap, setWordMap] = useState<Map <string, Word[]> | undefined>();

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

  useEffect(() => setVisibleVerses(initialVerses), [initialVerses, setVisibleVerses]);

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

  // get a Map of all the linked Words for the visible Verses
  useEffect( () => {
    createInterLinearMap(projectState.linksTable, visibleVerses, containers.targets!).then(
      setWordMap
    )
  },[projectState.linksTable, visibleVerses, containers.targets]);

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
      {/*<Grid*/}
      {/*  container*/}
      {/*  sx={{ pl: 4, flex: 8, overflow: 'auto' }}*/}
      {/*>*/}
      {/*  {*/}
      {/*    (verseElementBottom?.length ?? 0) > 0*/}
      {/*      ? verseElementBottom*/}
      {/*      : <Typography>No verse data for this reference.</Typography>*/}
      {/*  }*/}
      {/*</Grid>*/}
    </Fragment>
  );
};

export default InterLinearComponent;
