import { ProtoLinkSuggestion } from '../common/data/project/linkSuggestion';
import { CorpusContainer, Link, LinkStatus, Word } from '../structs';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { useCorpusContainers } from './useCorpusContainers';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { useDatabase } from './useDatabase';
import { useMemoAsync } from './useMemoAsync';
import { DefaultProjectId } from '../state/links/tableManager';
import { AlignmentSide } from '../common/data/project/corpus';
import _ from 'lodash';
import { useAppDispatch, useAppSelector } from '../app/index';
import { submitSuggestionResolution } from '../state/alignment.slice';

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
 * hook to provide suggestions for the currently edited link
 * @param editedLink the currently edited link, can be undefined or null if not present
 */
export const useSuggestionsContextInitializer = (editedLink?: Link | null): SuggestionsContextProps => {
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const { features: { enableTokenSuggestions } } = useContext(AppContext);

  const editedLinkExistsAndIsNewAndFeatureIsEnabled = useMemo<boolean>(() =>
    enableTokenSuggestions
    && !!editedLink
    && !editedLink?.id
    && editedLink?.metadata.status !== LinkStatus.APPROVED
    && editedLink?.metadata.status !== LinkStatus.NEEDS_REVIEW
    && editedLink?.metadata.status !== LinkStatus.REJECTED, [ editedLink, enableTokenSuggestions ]);

  const editedLinkHasExactlyOneTargetMember = useMemo(() => editedLink?.targets.length === 1, [editedLink?.targets.length]);
  const editedLinkHasExactlyOneSourceMember = useMemo(() => editedLink?.sources.length === 1, [editedLink?.sources.length]);

  /**
   * BCV of the target token in the currently edited link, undefined if not present
   */
  const targetTokenBcv = useMemo<BCVWP | undefined>(() => {
    if (!editedLinkExistsAndIsNewAndFeatureIsEnabled
      || !editedLinkHasExactlyOneTargetMember) return undefined;
    return BCVWP.parseFromString(editedLink!.targets.at(0)!);
  }, [ editedLinkExistsAndIsNewAndFeatureIsEnabled, editedLinkHasExactlyOneTargetMember, editedLink ]);
  /**
   * BCV of the source token in the currently edited link, undefined if not present
   */
  const sourceTokenBcv = useMemo<BCVWP | undefined>(() => {
    if (!editedLinkExistsAndIsNewAndFeatureIsEnabled
      || !editedLinkHasExactlyOneSourceMember) return undefined;
    return BCVWP.parseFromString(editedLink!.sources.at(0)!);
  }, [ editedLinkExistsAndIsNewAndFeatureIsEnabled, editedLinkHasExactlyOneSourceMember, editedLink ]);

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

  return {
    knownSide,
    sourceWordText,
    targetWordText
  };
};

/**
 * props of the SuggestionsContext
 */
export interface SuggestionsContextProps {
  knownSide?: AlignmentSide;
  /**
   * normalized representation of the source word text (if known side)
   */
  sourceWordText?: string;
  /**
   * normalized representation of the target word text (if known side)
   */
  targetWordText?: string;
}

/**
 * React Context for link suggestions
 */
export const SuggestionsContext = createContext<SuggestionsContextProps>({} as SuggestionsContextProps);

/**
 * status returned by the {@link useSuggestionsContextInitializer} hook
 */
export interface UseSuggestionsStatus {
  relevantSuggestions?: ProtoLinkSuggestion[];
}

const generateScoreNumberForStatus = (status: LinkStatus): number => {
  switch (status) {
    case LinkStatus.APPROVED:
      return 40_000_000;
    case LinkStatus.CREATED:
      return 30_000_000;
    case LinkStatus.NEEDS_REVIEW:
      return 20_000_000;
    case LinkStatus.REJECTED:
    default:
      return 0;
  }
}

const generateRelevancyScoreFromGroup = (score: { status: LinkStatus, count: number }): number => {
  const statusScore = generateScoreNumberForStatus(score.status);
  return (statusScore > 0) ? statusScore + score.count : 0;
}

/**
 * hook to provide a suggestion score for the given token (requires use inside {@link SuggestionsContextProps})
 * @param token to provide suggestions for
 * @param isAlreadyAligned whether the token is already aligned
 */
export const useTokenSuggestionRelevancyScore = (token: Word, isAlreadyAligned?: boolean) => {
  const dbApi = useDatabase();
  const dispatch = useAppDispatch();
  const { preferences, features: { enableTokenSuggestions } } = useContext(AppContext);
  const { knownSide, sourceWordText, targetWordText } = useContext(SuggestionsContext);

  /**
   * determines whether the search should be performed for the given token
   */
  const isTokenRelevantToSuggestions = useMemo(() =>
    enableTokenSuggestions
    && !isAlreadyAligned
    && token.side !== knownSide
    && !!token.normalizedText.trim(),
  [ enableTokenSuggestions, knownSide, token.side, token.normalizedText, isAlreadyAligned ]);

  const searchSourceText = useMemo(() => sourceWordText ?? (token.side === AlignmentSide.SOURCE ? token.normalizedText : undefined), [ sourceWordText, token.side, token.normalizedText ]);
  const searchTargetText = useMemo(() => targetWordText ?? (token.side === AlignmentSide.TARGET ? token.normalizedText : undefined), [ targetWordText, token.side, token.normalizedText ]);

  const score = useMemoAsync<number|undefined>(async () => {
    if (!isTokenRelevantToSuggestions) return undefined;
    console.time('dbApi.findLinkStatusesByAlignedWord');
    const groupedLinks = await dbApi.findLinkStatusesByAlignedWord(
      preferences?.currentProject ?? DefaultProjectId,
      searchSourceText,
      searchTargetText,
      true);
    console.timeEnd('dbApi.findLinkStatusesByAlignedWord');
    return _.max(groupedLinks.map(generateRelevancyScoreFromGroup)) ?? 0;
  }, [ dbApi.findLinkStatusesByAlignedWord, preferences?.currentProject, searchSourceText, searchTargetText ]);

  /**
   * score is defined and non-zero
   */
  const scoreIsRelevant = useMemo(() => !!score && score > 0 && knownSide && token.side !== knownSide, [ score, token.side, knownSide ]);

  const editedLink = useAppSelector((state) => state.alignment.present.inProgressLink);

  const wasSubmittedForConsideration = useMemo<boolean>(() => {
    switch (token.side) {
      case AlignmentSide.SOURCE:
        return editedLink?.suggestedSources.map(({ tokenRef }) => tokenRef).map(BCVWP.parseFromString).some((bcv) => BCVWP.compare(bcv, BCVWP.parseFromString(token.id)) === 0) ?? false;
      case AlignmentSide.TARGET:
        return editedLink?.suggestedTargets.map(({ tokenRef }) => tokenRef).map(BCVWP.parseFromString).some((bcv) => BCVWP.compare(bcv, BCVWP.parseFromString(token.id)) === 0) ?? false;
    }
  }, [ token.id, token.side, editedLink?.suggestedSources, editedLink?.suggestedTargets ]);

  useEffect(() => {
    if (!scoreIsRelevant || !score || wasSubmittedForConsideration) return;
    dispatch(submitSuggestionResolution({
      suggestions: [{
        side: token.side,
        tokenRef: BCVWP.sanitize(token.id),
        score
      }]
    }));
  }, [ scoreIsRelevant, score, wasSubmittedForConsideration, token, dispatch ]);

  const isMostRelevantSuggestion = useMemo<boolean>(() => {
    if (!scoreIsRelevant) return false;
    switch (token.side) {
      case AlignmentSide.SOURCE:
        const srcTopScore = editedLink?.suggestedSources.at(0);
        return !!srcTopScore
                && BCVWP.compareString(token.id, srcTopScore?.tokenRef) === 0
                && (score ?? 0) >= (srcTopScore?.score ?? 0);
      case AlignmentSide.TARGET:
        const tgtTopScore = editedLink?.suggestedTargets.at(0);
        return !!tgtTopScore
                && BCVWP.compareString(token.id, tgtTopScore?.tokenRef) === 0
                && (score ?? 0) >= (tgtTopScore?.score ?? 0);
    }
  }, [ editedLink, scoreIsRelevant, score, token.id, token.side ]);

  return {
    wasSubmittedForConsideration,
    isMostRelevantSuggestion,
    score,
    scoreIsRelevant
  };
}

/**
 * hook to provide relevant suggestions for the given token (requires use inside {@link SuggestionsContextProps})
 * @param token to provide suggestions for
 * @param isAlreadyAligned whether the token is already aligned
 */
export const useRelevantSuggestions = (token: Word, isAlreadyAligned?: boolean): UseSuggestionsStatus => {
  const dbApi = useDatabase();
  const { sourceContainer, targetContainer } = useCorpusContainers();
  const { preferences } = useContext(AppContext);
  const { knownSide, sourceWordText, targetWordText } = useContext(SuggestionsContext);

  /**
   * determines whether the search should be performed for the given token
   */
  const isTokenRelevantToSuggestions = useMemo(() =>
    !isAlreadyAligned && token.side !== knownSide && !!token.normalizedText.trim(),
    [ knownSide, token.side, token.normalizedText, isAlreadyAligned ]);

  const searchSourceText = useMemo(() => sourceWordText ?? (token.side === AlignmentSide.SOURCE ? token.normalizedText : undefined), [ sourceWordText, token.side, token.normalizedText ]);
  const searchTargetText = useMemo(() => targetWordText ?? (token.side === AlignmentSide.TARGET ? token.normalizedText : undefined), [ targetWordText, token.side, token.normalizedText ]);

  const similarLinks = useMemoAsync<Link[] | undefined>(async () => {
    if (!isTokenRelevantToSuggestions || (!searchSourceText && !searchTargetText)) return undefined;
    console.time('dbApi.corporaGetLinksByAlignedWord');
    const tmpLinks = await dbApi.corporaGetLinksByAlignedWord(
      preferences?.currentProject ?? DefaultProjectId,
      searchSourceText,
      searchTargetText,
      {
        field: 'status',
        sort: 'asc'
      },
      true,
      10);
    console.timeEnd('dbApi.corporaGetLinksByAlignedWord');
    return tmpLinks;
  }, [ dbApi, preferences?.currentProject, searchSourceText, searchTargetText, token.side, token.normalizedText ]);

  const relevantSuggestions = useMemo<ProtoLinkSuggestion[]|undefined>(() => {
    if (!similarLinks
      || !knownSide
      || !sourceContainer
      || !targetContainer) return undefined;
    return similarLinks
      .map((l): ProtoLinkSuggestion|undefined => makeSuggestionBasedOnLink(knownSide === AlignmentSide.TARGET ? sourceContainer : targetContainer, knownSide, l))
      .filter((suggestion) => !!suggestion);
  }, [ similarLinks, knownSide, sourceContainer, targetContainer ]);

  return {
    relevantSuggestions
  };
}
