import React, { useContext, useEffect, useState } from 'react';
import BCVWP from '../bcvwp/BCVWPSupport';
import { LayoutContext } from '../../AppLayout';
import { CorpusContainer, Word } from '../../structs';
import { BCVDisplay } from '../bcvwp/BCVDisplay';
import Workbench from '../../workbench';
import BCVNavigation from '../bcvNavigation/BCVNavigation';
import { AppContext } from '../../App';
import { resetTextSegments } from '../../state/alignment.slice';
import { useAppDispatch } from '../../app';

const defaultDocumentTitle = 'ClearAligner';

interface AlignmentEditorProps {
  showNavigation?: boolean;
}

export const AlignmentEditor: React.FC<AlignmentEditorProps> = ({showNavigation = true}) => {
  const layoutCtx = useContext(LayoutContext);
  const [availableWords, setAvailableWords] = useState([] as Word[]);
  const [selectedCorporaContainers, setSelectedCorporaContainers] = useState(
    [] as CorpusContainer[]
  );

  const appCtx = useContext(AppContext);
  const dispatch = useAppDispatch();

  // set current reference to default if none set
  useEffect(() => {
    if (!appCtx.currentReference) {
      appCtx.setCurrentReference(new BCVWP(45, 5, 3)); // set current reference to default
    }
  }, [appCtx, appCtx.currentReference, appCtx.setCurrentReference]);

  React.useEffect(() => {
    if (appCtx.currentReference) {
      layoutCtx.setWindowTitle(
        `${defaultDocumentTitle}: ${
          appCtx.currentReference?.getBookInfo()?.EnglishBookName
        } ${appCtx.currentReference?.chapter}:${appCtx.currentReference?.verse}`
      );
    } else {
      layoutCtx.setWindowTitle(defaultDocumentTitle);
    }
  }, [appCtx.currentReference, layoutCtx]);

  React.useEffect(() => {
    const targetCorpora = appCtx.appState.currentProject?.targetCorpora;
    setSelectedCorporaContainers([targetCorpora, appCtx.appState.sourceCorpora].filter(v => v) as CorpusContainer[]);
    setAvailableWords(targetCorpora?.corpora.flatMap(({ words }) => words) ?? []);
  }, [appCtx.appState]);

  useEffect(() => {
    layoutCtx?.setMenuBarDelegate(
      <BCVDisplay currentPosition={appCtx.currentReference} />
    );
  }, [layoutCtx, appCtx.currentReference]);

  // reset selected tokens when the book, chapter or verse changes
  useEffect(() => {
    dispatch(resetTextSegments())
  }, [appCtx.currentReference?.book, appCtx.currentReference?.chapter, appCtx.currentReference?.verse]);

  return (
    <>
      {
        showNavigation && (
          <div style={{ display: 'grid', justifyContent: 'center' }}>
            <br />
            <BCVNavigation
              horizontal
              disabled={!availableWords || availableWords.length < 1}
              words={availableWords}
              currentPosition={appCtx.currentReference ?? undefined}
              onNavigate={appCtx.setCurrentReference}
            />
          </div>
        )
      }
      <Workbench
        corpora={selectedCorporaContainers}
        currentPosition={appCtx.currentReference}
      />
    </>
  );
};
