import { ProtoLinkSuggestion } from '../common/data/project/linkSuggestion';
import { CorpusContainer, Link, LinkStatus, Word } from '../structs';
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
 * generates a {@link ProtoLinkSuggestion} based on a link,
 * the container the suggestion will be coming from
 * and the known side (suggestion will come from the unknown side)
 * @param container the {@link CorpusContainer to look up the word text from}
 * @param knownSide which side is known
 * @param l the link to make suggestions based on
 */
const makeSuggestionBasedOnLink = (container: CorpusContainer, knownSide: AlignmentSide, l: Link): ProtoLinkSuggestion|undefined => {
  const tokenId = knownSide === AlignmentSide.TARGET ? l.sources.at(0)! : l.targets.at(0)!;
  const verse = container.verseByReferenceString(tokenId);
  if (!verse) return undefined;
  const token = verse.words.find((token) => token.id === tokenId);
  if (!token) return undefined;
  return {
    side: knownSide === AlignmentSide.TARGET ? AlignmentSide.SOURCE : AlignmentSide.TARGET,
    normalizedTokenText: token.normalizedText
  };
};

/**
 * status returned by the {@link useSuggestions} hook
 */
export interface UseSuggestionsStatus {
  relevantSuggestions?: ProtoLinkSuggestion[];
}

/**
 * hook to provide suggestions for the currently edited link
 * @param token to provide suggestions for
 * @param editedLink the currently edited link, can be undefined or null if not present
 */
export const useSuggestions = (token: Word, editedLink?: Link | null): UseSuggestionsStatus => {
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const dbApi = useDatabase();
  const { preferences, features: { enableTokenSuggestions } } = useContext(AppContext);

  const editedLinkExistsAndIsNew = useMemo<boolean>(() =>
    !!editedLink
    && !editedLink?.id
    && editedLink?.metadata.status !== LinkStatus.APPROVED
    && editedLink?.metadata.status !== LinkStatus.NEEDS_REVIEW
    && editedLink?.metadata.status !== LinkStatus.REJECTED, [ editedLink ]);

  const editedLinkHasExactlyOneTargetMember = useMemo(() => editedLink?.targets.length === 1, [editedLink?.targets.length]);
  const editedLinkHasExactlyOneSourceMember = useMemo(() => editedLink?.sources.length === 1, [editedLink?.sources.length]);

  /**
   * BCV of the target token in the currently edited link, undefined if not present
   */
  const targetTokenBcv = useMemo<BCVWP | undefined>(() => {
    if (!editedLinkExistsAndIsNew
      || !editedLinkHasExactlyOneTargetMember) return undefined;
    return BCVWP.parseFromString(editedLink!.targets.at(0)!);
  }, [ editedLinkExistsAndIsNew, editedLinkHasExactlyOneTargetMember, editedLink ]);
  /**
   * BCV of the source token in the currently edited link, undefined if not present
   */
  const sourceTokenBcv = useMemo<BCVWP | undefined>(() => {
    if (!editedLinkExistsAndIsNew
      || !editedLinkHasExactlyOneSourceMember) return undefined;
    return BCVWP.parseFromString(editedLink!.sources.at(0)!);
  }, [ editedLinkExistsAndIsNew, editedLinkHasExactlyOneSourceMember, editedLink ]);

  /**
   * indicates which side of the link is known, other side needs to be searched for
   */
  const knownSide = useMemo<AlignmentSide | undefined>(() => {
    if (sourceTokenBcv && !targetTokenBcv) return AlignmentSide.SOURCE;
    if (targetTokenBcv && !sourceTokenBcv) return AlignmentSide.TARGET;
    return undefined;
  }, [ sourceTokenBcv, targetTokenBcv ]);

  const sourceVerse = useMemo(() => sourceTokenBcv ? sourceContainer?.verseByReference(sourceTokenBcv) : undefined,
    [ sourceTokenBcv, sourceContainer ]);
  const targetVerse = useMemo(() => targetTokenBcv ? targetContainer?.verseByReference(targetTokenBcv) : undefined,
    [ targetTokenBcv, targetContainer ]);

  const sourceWordText = useMemo<string | undefined>(() => {
    if (!sourceVerse || !sourceTokenBcv || knownSide !== AlignmentSide.SOURCE) return undefined;
    return sourceVerse?.words.find((token) => BCVWP.parseFromString(token.id!).equals(sourceTokenBcv))?.normalizedText;
  }, [ sourceVerse, knownSide, sourceTokenBcv ]);
  const targetWordText = useMemo<string | undefined>(() => {
    if (!targetVerse || !targetTokenBcv || knownSide !== AlignmentSide.TARGET) return undefined;
    return targetVerse?.words.find((token) => BCVWP.parseFromString(token.id!).equals(targetTokenBcv))?.normalizedText;
  }, [ targetVerse, knownSide, targetTokenBcv ]);

  const similarLinks = useMemoAsync<Link[] | undefined>(async () => {
    if (!enableTokenSuggestions || (!sourceWordText && !targetWordText)) return undefined;
    const tmpLinks = await dbApi.corporaGetLinksByAlignedWord(
      preferences?.currentProject ?? DefaultProjectId,
      sourceWordText,
      targetWordText,
      undefined,
      true,
      20);
    return tmpLinks
      .sort((a, b) => convertLinkStatusToRelevanceOrdinal(a.metadata.status) - convertLinkStatusToRelevanceOrdinal(b.metadata.status));
  }, [ enableTokenSuggestions, dbApi, preferences?.currentProject, sourceWordText, targetWordText ]);

  const protoSuggestions = useMemo<ProtoLinkSuggestion[]|undefined>(() => {
    if (!similarLinks
      || !knownSide
      || !sourceContainer
      || !targetContainer) return undefined;
    return similarLinks
      // remove links with more than one source and/or more than one target
      .filter((l) => l.sources.length === 1 && l.targets.length === 1)
      .map((l): ProtoLinkSuggestion|undefined => makeSuggestionBasedOnLink(knownSide === AlignmentSide.TARGET ? sourceContainer : targetContainer, knownSide, l))
      .filter((suggestion) => !!suggestion);
  }, [ similarLinks, knownSide, sourceContainer, targetContainer ]);

  const relevantSuggestions = useMemo(() =>
    protoSuggestions?.filter((s) => s.side === token.side && s.normalizedTokenText === token.normalizedText),
  [ token.side, token.normalizedText, protoSuggestions ]);


  return {
    relevantSuggestions
  };
};
