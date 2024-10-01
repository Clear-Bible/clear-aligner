import { LinksTable } from '../state/links/tableManager';
import { CorpusContainer, Link, LinkStatus, Verse, Word } from '../structs';
import { AlignmentSide } from '../common/data/project/corpus';

export interface LinkWords {
  link: Link,
  words: Word[]
}

export const createInterlinearMap = async (
  linksTable: LinksTable,
  sourceVerses: Verse[],
  targetContainer: CorpusContainer,
  includeRejectedLinks = false
): Promise<Map<string, LinkWords[]>> => {
  const result = new Map<string, LinkWords[]>();
  for (const sourceVerse of sourceVerses) {
    const sourceBcvId = sourceVerse.bcvId;
    const links = await linksTable.findByBCV(AlignmentSide.SOURCE, sourceBcvId.book!, sourceBcvId.chapter!, sourceBcvId.verse!); //database query
    for (const link of links) {
      if (!includeRejectedLinks
        && link.metadata.status === LinkStatus.REJECTED) {
        continue;
      }
      for (const sourceWordId of link.sources) {
        const linkWord = {
          link,
          words: []
        } as LinkWords;
        for (const targetWordId of link.targets) {
          const targetWord = targetContainer.wordByReferenceString(targetWordId);
          if (targetWord) {
            linkWord.words.push(targetWord);
          }
        }
        if (linkWord.words.length > 0) {
          const linkWords = result.get(sourceWordId) ?? [];
          linkWords.push(linkWord);
          result.set(sourceWordId, linkWords);
        }
      }
    }
  }
  return result;
};
