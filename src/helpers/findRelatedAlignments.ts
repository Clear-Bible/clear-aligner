import { Word, Link } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { VirtualTableLinks } from '../state/links/tableManager';

// Takes `ProjectState` and a `Word`.
// calls back with `Link` items that include the word.
// `Link`s are filtered by relation to the word.
const findRelatedAlignments = (
  word: Word,
  linksTable?: VirtualTableLinks
): Link[] => {
  if (!linksTable) {
    return [];
  }
  return linksTable.findByWord(word.side, BCVWP.parseFromString(word.id));
};

export default findRelatedAlignments;
