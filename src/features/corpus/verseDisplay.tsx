import { AlignmentSide, Corpus, Link, Verse, Word } from '../../structs';
import { ReactElement, useMemo } from 'react';
import { WordDisplay } from '../wordDisplay';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';
import { useDataLastUpdated, useFindLinksByBCV, useGetLink } from '../../state/links/tableManager';

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
 * @param onlyLinkIds
 * @param allowGloss
 * @constructor
 */
export const VerseDisplay = ({
                               readonly,
                               corpus,
                               verse,
                               onlyLinkIds,
                               allowGloss = false
                             }: VerseDisplayProps) => {
  const dataLastUpdated = useDataLastUpdated();
  const verseTokens: Word[][] = useMemo(
    () => groupPartsIntoWords(verse.words),
    [verse?.words]
  );
  const alignmentSide = useMemo(() => corpus?.side as AlignmentSide, [corpus?.side]);
  const { result: onlyLink } = useGetLink(
    (onlyLinkIds?.length ?? 0) > 0 ? onlyLinkIds?.[0] : undefined,
    `${verse.bcvId?.toReferenceString()}-${dataLastUpdated}`
  );
  const { result: allLinks } = useFindLinksByBCV(
    alignmentSide,
    (onlyLinkIds?.length ?? 0) < 1 ? verse.bcvId.book : undefined,
    (onlyLinkIds?.length ?? 0) < 1 ? verse.bcvId.chapter : undefined,
    (onlyLinkIds?.length ?? 0) < 1 ? verse.bcvId.verse : undefined,
    readonly,
    `${verse.bcvId?.toReferenceString()}-${dataLastUpdated}`
  );

  const linkMap = useMemo(() => {
    if ((!allLinks || allLinks.length < 1)
      && !onlyLink) {
      return;
    }
    const result = new Map<string, Link>();
    (allLinks ?? [onlyLink as Link])
      .filter(link => onlyLinkIds?.includes(link!.id!) ?? true)
      .forEach(link => ((alignmentSide === AlignmentSide.SOURCE
        ? link!.sources
        : link!.targets) ?? [])
        .forEach(wordId => result.set(wordId, link!)));
    return result;
  }, [onlyLinkIds, allLinks, onlyLink, alignmentSide]);

  return (
    <>
      {(verseTokens || []).map(
        (token: Word[], index): ReactElement => (
          <WordDisplay
            key={`${alignmentSide}:${index}/${token.at(0)?.id}`}
            links={linkMap}
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
