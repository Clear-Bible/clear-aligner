import { LanguageInfo, Verse, Word } from '../../structs';
import { ReactElement, useMemo } from 'react';
import { WordDisplay } from '../wordDisplay';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';

export interface VerseDisplayProps {
  readonly?: boolean;
  languageInfo?: LanguageInfo;
  verse: Verse;
}

/**
 * Display the text of a verse and highlight the words included in alignments, includes a read-only mode for display
 * which doesn't edit alignments
 * @param readonly optional property to specify if the verse should be displayed in read-only mode
 * @param languageInfo language information to determine how the verse should be displayed
 * @param verse verse to be displayed
 * @constructor
 */
export const VerseDisplay = ({
  readonly,
  languageInfo,
  verse,
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
            readonly={readonly}
            key={`${index}/${token.at(0)?.id}`}
            languageInfo={languageInfo}
            parts={token}
          />
        )
      )}
    </>
  );
};
