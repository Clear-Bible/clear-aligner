import { CorpusContainer, Verse, Word } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';
import React, { ReactElement, useContext, useEffect, useMemo, useState } from 'react';
import useDebug from '../../hooks/useDebug';
import { AppContext } from '../../App';
import { LinksTable } from '../../state/links/tableManager';
import { AlignmentSide } from '../../common/data/project/corpus';

interface LiveInterlinearProps {
  containers: CorpusContainer[]; // TODO - remove this comment!
  position?: BCVWP;
  visibleSourceVerses: Verse[];
}

const createInterLinearMap = async (linksTable: LinksTable, verses: Verse[], targetContainer: CorpusContainer): Promise<Map<string, Word[]>> => {
  const result = new Map<string, Word[]>();

  for (const verse of verses) {
    const bcvId = verse.bcvId;
    const links = await linksTable.findByBCV(AlignmentSide.SOURCE, bcvId.book!, bcvId.chapter!, bcvId.verse!); //database query
    for (const link of links) {
      for (const sourceWordId of link.sources) {
        const targetWords = result.get(sourceWordId) ?? [];
        for (const targetWordId of link.targets) {
          const targetWord = targetContainer.wordByReferenceString(targetWordId);
          if (targetWord) {
            targetWords.push(targetWord);
          }
        }
        if (targetWords.length > 0) {
          result.set(sourceWordId, targetWords);
        }
      }
    }
  }
  return result;
};

export const LiveInterlinear: React.FC<LiveInterlinearProps> = ({
                                                                  containers,
                                                                  position,
                                                                  visibleSourceVerses
                                                                }): ReactElement => {
  useDebug('LiveInterlinear');

  const { projectState } = useContext(AppContext);
  const [wordMap, setWordMap] = useState<Map<string, Word[]> | undefined>();
  const [sourceContainer, targetContainer] = useMemo(() => {
    return [containers?.find(c => c.id === AlignmentSide.SOURCE),
      containers?.find(c => c.id === AlignmentSide.TARGET)];
  }, [containers]);

  useEffect(() => {
    if (!targetContainer) {
      return;
    }
    createInterLinearMap(projectState.linksTable, visibleSourceVerses, targetContainer).then(
      setWordMap
    );
  }, [projectState.linksTable, visibleSourceVerses, targetContainer]);

  return (<></>);
};
