import { Corpus, Verse, Word } from '../../structs';
import { ReactElement, useMemo } from 'react';
import { WordDisplay } from '../wordDisplay';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';

/**
 * optionally declare only link data from the given links will be reflected in the verse display
 */
export interface LimitedToLinks {
  onlyLinkIds?: string[]; // alignment link ids
}

export interface VerseDisplayProps extends LimitedToLinks {
  readonly?: boolean;
  corpus?: Corpus;
  verse: Verse;
  allowGloss?: boolean;
}

/**
 * Display the text of a verse and highlight the words included in alignments, includes a read-only mode for display
 * which doesn't edit alignments
 * @param readonly optional property to specify if the verse should be displayed in read-only mode
 * @param corpus Corpus containing language information to determine how the verse should be displayed
 * @param verse verse to be displayed
 * @constructor
 */
export const VerseDisplay = ({
  readonly,
  corpus,
  verse,
  onlyLinkIds,
  allowGloss = false
}: VerseDisplayProps) => {
  const verseTokens: Word[][] = useMemo(
    () => groupPartsIntoWords(verse.words),
    [verse?.words]
  );

  return (
    <>
      {(verseTokens || []).map(
        (token: Word[], index): ReactElement => (
          <WordDisplay
            key={`${index}/${token.at(0)?.id}`}
            readonly={readonly}
            onlyLinkIds={onlyLinkIds}
            corpus={corpus}
            parts={token}
            allowGloss={allowGloss}
          />
        )
      )}
    </>
  );
};
