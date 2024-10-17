/**
 * This file contains the VerseCell component which renders verse text for use
 * in the AlignmentTable
 */
import { GridRenderCellParams, useGridApiContext } from '@mui/x-data-grid';
import { RepositoryLink, Verse } from '../../../structs';
import { useContext } from 'react';
import _ from 'lodash';
import BCVWP, { BCVWPField } from '../../bcvwp/BCVWPSupport';
import { VerseDisplay } from '../../corpus/verseDisplay';
import { AlignmentTableContext } from '../alignmentTable';
import { useCorpusContainers } from '../../../hooks/useCorpusContainers';
import { AlignmentSide } from '../../../common/data/project/corpus';
import { useTheme } from '@mui/material';
import { WordDisplayVariant } from '../../wordDisplay';

/**
 * Render cells with verse text in the appropriate font and text orientation for the verse
 * @param row rendering params for this Link entry
 */
export const VerseCell = (
  row: GridRenderCellParams<RepositoryLink, any, any>
) => {
  const tableCtx = useContext(AlignmentTableContext);
  const { sourceContainer, targetContainer } = useCorpusContainers();

  const container =
    tableCtx.wordSource === AlignmentSide.SOURCE
      ? sourceContainer
      : targetContainer;
  const verses: Verse[] = _.uniqWith(
    (tableCtx.wordSource === AlignmentSide.SOURCE ? row.row?.sources : row.row?.targets)
      ?.filter(BCVWP.isValidString)
      .map((ref) => BCVWP.truncateTo(ref, BCVWPField.Verse)),
    _.isEqual
  )
    .flatMap((ref) =>
      container?.corpora.flatMap(({ wordsByVerse }) => wordsByVerse[ref])
    )
    .filter((v) => !!v)
    .sort((a, b) => BCVWP.compare(a!.bcvId, b!.bcvId)) as Verse[];

  const anyVerse = verses.find((v) => !!v.bcvId);
  const languageInfo = container?.languageAtReferenceString(anyVerse?.bcvId!.toReferenceString()!);

  const apiRef = useGridApiContext();
  const theme = useTheme();

  return (
    <div
      lang={languageInfo?.code}
      style={{
        ...(languageInfo?.textDirection
          ? { direction: languageInfo.textDirection }
          : {}),
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        color: theme.typography.unlinked.color,
      }}
    >
      {verses.map((verse: Verse) => (
        <span
          style = {{color: theme.typography.linked.color}}
          key={verse?.bcvId?.toReferenceString() ?? ''}
        >
          <VerseDisplay
            variant={WordDisplayVariant.TEXT}
            key={verse?.bcvId?.toReferenceString() ?? ''}
            onlyLinkIds={row.row.id ? [row.row.id] : []}
            readonly
            verse={verse}
            corpus={container?.corpusAtReferenceString(verse?.bcvId?.toReferenceString())}
            apiRef={apiRef}
          />
        </span>
      ))}
    </div>
  );
};
