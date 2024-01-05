import { AlignmentSide, Link } from '../structs';
import _ from 'lodash';

export const findFirstRefFromLink = (
  row: Link,
  wordSource?: AlignmentSide
): string | undefined => {
  let rowByWordSource: string[];
  switch(wordSource) {
    case AlignmentSide.SOURCE:
      rowByWordSource = row.sources;
      break;
    case AlignmentSide.TARGET:
      rowByWordSource = row.targets;
      break;
    default:
      rowByWordSource = [...row.sources, ...row.targets];
      break;
  }

  return _.uniqWith(rowByWordSource, _.isEqual)
    .sort()
    .find((value) => value);
}
