import { LinksTable } from '../state/links/tableManager';
import { Link, LinkStatus, NamedContainers, Verse, Word } from '../structs';
import { AlignmentSide } from '../common/data/project/corpus';

export interface LinkWords {
  link: Link,
  words: Word[]
}

/**
 * Packaging for interlinear mapping information for a particular verse.
 */
export interface InterlinearMap {
  sourceVerse: Verse,
  containers: NamedContainers,
  sourceMap: Map<string, LinkWords[]>
}

/**
 * Queries the database for a list of alignments for a given verse, then organizes them into
 * convenient source/target word mappings for easier rendering.
 * @param linksTable Alignment table (required).
 * @param sourceVerse Source verse (required).
 * @param containers Source/target containers (required).
 * @param includeRejectedLinks True to include rejected links, false otherwise.
 */
export const createInterlinearMap = async (
  linksTable: LinksTable,
  sourceVerse: Verse,
  containers: NamedContainers,
  includeRejectedLinks = false
): Promise<InterlinearMap | undefined> => {
  if (!containers.isComplete()) {
    return;
  }
  const sourceMap = new Map<string, LinkWords[]>();
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
        const targetWord = containers.targets?.wordByReferenceString(targetWordId);
        if (targetWord) {
          linkWord.words.push(targetWord);
        }
      }
      if (linkWord.words.length > 0) {
        const linkWords = sourceMap.get(sourceWordId) ?? [];
        linkWords.push(linkWord);
        sourceMap.set(sourceWordId, linkWords);
      }
    }
  }
  return { sourceVerse, containers, sourceMap } as InterlinearMap;
};
