import { LinkSuggestion } from '../common/data/project/linkSuggestion';
import { EditedLink, Link, LinkStatus } from '../structs';
import { useContext, useMemo } from 'react';
import { AppContext } from '../App';
import { useCorpusContainers } from './useCorpusContainers';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { useDatabase } from './useDatabase';
import { useMemoAsync } from './useMemoAsync';
import { DefaultProjectId } from '../state/links/tableManager';
import { AlignmentSide } from '../common/data/project/corpus';

/**
 * function returns a number representing the link status
 * The returned number is sortable (ascendant) for suggestion relevancy,
 * with 0 being the most relevant {@link LinkStatus.APPROVED}
 */
const convertLinkStatusToRelevanceOrdinal = (status: LinkStatus) => {
  switch (status) {
    case LinkStatus.APPROVED:
      return 0;
    case LinkStatus.CREATED:
      return 1;
    case LinkStatus.NEEDS_REVIEW:
      return 2;
    case LinkStatus.REJECTED:
      return 1_000;
  }
};

/**
 * props for the {@link useSuggestions} hook
 */
export interface UseSuggestionsProps {
  editedLink?: EditedLink | null;
}

/**
 * status returned by the {@link useSuggestions} hook
 */
export interface UseSuggestionsStatus {
  suggestions?: LinkSuggestion[];
}

export const useSuggestions = ({ editedLink }: UseSuggestionsProps): UseSuggestionsStatus => {
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const dbApi = useDatabase();
  const { preferences, features: { enableTokenSuggestions } } = useContext(AppContext);

  const editedLinkExistsAndIsNew = useMemo<boolean>(() =>
    !!editedLink
    && !editedLink?.id
    && editedLink?.metadata.status !== LinkStatus.APPROVED
    && editedLink?.metadata.status !== LinkStatus.NEEDS_REVIEW
    && editedLink?.metadata.status !== LinkStatus.REJECTED, [editedLink?.id, editedLink?.metadata.status]);

  const editedLinkHasExactlyOneTargetMember = useMemo(() => editedLink?.targets.length === 1, [editedLink?.targets.length]);

  /**
   * BCV of the target token in the currently edited link, undefined if not present
   */
  const targetTokenBcv = useMemo<BCVWP | undefined>(() => {
    if (!editedLinkExistsAndIsNew
      || !editedLinkHasExactlyOneTargetMember) return undefined;
    return BCVWP.parseFromString(editedLink!.targets.at(0)!);
  }, []);
  /**
   * BCV of the source token in the currently edited link, undefined if not present
   */
  const sourceTokenBcv = useMemo<BCVWP | undefined>(() => {
    if (!editedLinkExistsAndIsNew
      || !editedLinkHasExactlyOneTargetMember) return undefined;
    return BCVWP.parseFromString(editedLink!.sources.at(0)!);
  }, []);

  /**
   * indicates which side of the link is known, other side needs to be searched for
   */
  const knownSide = useMemo<AlignmentSide | undefined>(() => {
    if (sourceTokenBcv && !targetTokenBcv) return AlignmentSide.SOURCE;
    if (targetTokenBcv && !sourceTokenBcv) return AlignmentSide.TARGET;
    return undefined;
  }, []);

  const sourceVerse = useMemo(() => sourceTokenBcv ? sourceContainer?.verseByReference(sourceTokenBcv) : undefined, []);
  const targetVerse = useMemo(() => targetTokenBcv ? targetContainer?.verseByReference(targetTokenBcv) : undefined, []);

  const sourceWordText = useMemo<string | undefined>(() => {
    if (!sourceVerse || !sourceTokenBcv || knownSide !== AlignmentSide.SOURCE) return undefined;
    return sourceVerse?.words.find((token) => token.id === sourceTokenBcv?.toReferenceString())?.normalizedText;
  }, [ sourceVerse, knownSide, sourceTokenBcv ]);
  const targetWordText = useMemo<string | undefined>(() => {
    if (!targetVerse || !targetTokenBcv || knownSide !== AlignmentSide.TARGET) return undefined;
    return targetVerse?.words.find((token) => token.id === targetTokenBcv?.toReferenceString())?.normalizedText;
  }, [ targetVerse, knownSide, targetTokenBcv ]);

  const similarLinks = useMemoAsync<Link[] | undefined>(async () => {
    if (!enableTokenSuggestions) return undefined;
    const tmpLinks = await dbApi.corporaGetLinksByAlignedWord(
      preferences?.currentProject ?? DefaultProjectId,
      sourceWordText,
      targetWordText);
    return tmpLinks
      .filter((l) => l.metadata.status !== LinkStatus.REJECTED)
      .sort((a, b) => convertLinkStatusToRelevanceOrdinal(a.metadata.status) - convertLinkStatusToRelevanceOrdinal(b.metadata.status));
  }, [enableTokenSuggestions, dbApi, preferences?.currentProject, sourceWordText, targetWordText]);

  const suggestions = useMemo(() => {
    if (!similarLinks) return undefined;
    similarLinks.map((l) => {
    });
  }, [similarLinks]);

  return {
    suggestions
  };
};
