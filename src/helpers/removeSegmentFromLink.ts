/**
 * This file contains the removeSegmentFromLink helper function, which is not
 * currently used.
 */
import { RepositoryLink, Word } from 'structs';
import { AlignmentSide } from '../common/data/project/corpus';

const removeFromArray = (originArray: string[], id: string): string[] => {
  const _array = originArray.concat([]);
  const index = _array.findIndex((sourceId: string) => sourceId === id);
  _array.splice(index, 1);
  return _array;
};

const removeSegmentFromLink = (
  wordToRemove: Word,
  link: RepositoryLink
): RepositoryLink => {
  switch (wordToRemove.side) {
    case AlignmentSide.SOURCE:
      link.sources = removeFromArray(link.sources, wordToRemove.id);
      break;
    case AlignmentSide.TARGET:
      link.targets = removeFromArray(link.targets, wordToRemove.id);
      break;
  }

  return link;
};

export default removeSegmentFromLink;
