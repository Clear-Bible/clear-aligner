import { AlignmentSide, Word } from '../../structs';
import { FullyResolvedLink } from './structs';
import { groupPartsIntoWords } from '../../helpers/groupPartsIntoWords';

/**
 * generate list (alphabetical) of word texts from alignment link, container and side directive
 * @param link link data to where word ids are listed
 * @param side side to pull word ids from
 */
export const generateWordListFromCorpusContainerAndLink = (
  link: FullyResolvedLink,
  side: AlignmentSide
): string[] => {
  const partsList = Array.from(
    side === AlignmentSide.SOURCE ? link.sourceResolvedWords : link.targetResolvedWords
  )
    .map((word) => word.word)
    .filter((word) => !!word) as Word[];
  return groupPartsIntoWords(partsList)
    .map((parts) => parts.map(({ text }) => text.trim().toLowerCase()).join(''))
    .sort();
};
