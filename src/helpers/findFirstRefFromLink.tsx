import { DisplayableLink } from '../structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import _ from 'lodash';
import { WordSource } from '../features/concordanceView/concordanceView';

export const findFirstRefFromLink = (
  row: DisplayableLink,
  wordSource?: WordSource
): BCVWP | undefined => {
  let rowByWordSource: string[];
  switch(wordSource) {
    case WordSource.SOURCE:
      rowByWordSource = row.sources;
      break;
    case WordSource.TARGET:
      rowByWordSource = row.targets;
      break;
    default:
      rowByWordSource = [...row.sources, ...row.targets];
      break;
  }
  const refString = _.uniqWith(rowByWordSource, _.isEqual)
    .sort()
    .find((value) => value);
  if (!refString) {
    return undefined;
  }
  return BCVWP.parseFromString(refString);
};
