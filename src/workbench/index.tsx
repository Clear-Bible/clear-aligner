/**
 * This file contains the WorkBench component which is used in the Alignment
 * Editor and wraps the Editor component.
 */
import React, { ReactElement, useMemo } from 'react';
import { CorpusContainer, NamedContainers } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import Editor, { CustomEditorStyles } from '../features/editor';

interface WorkbenchProps {
  corpora?: CorpusContainer[];
  currentPosition?: BCVWP | null;
  usePaddingForEditorContainer?: boolean;
  styles?: CustomEditorStyles;
}

const Workbench: React.FC<WorkbenchProps> = ({
  corpora,
  currentPosition,
  usePaddingForEditorContainer = true,
  styles,
}: WorkbenchProps): ReactElement => {
  const namedContainers = useMemo(() => {
    return new NamedContainers(corpora ?? []);
  }, [corpora]);

  return (
    <>
      {namedContainers?.isComplete()
        && (<div
            style={{
              display: 'flex',
              justifyContent: 'center',
              margin: 'auto',
              marginTop: '0',
              marginBottom: '0',
              minWidth: '100%',
              height: 'calc(100% - 64px)',
            }}
          >
            <Editor
              containers={namedContainers}
              position={currentPosition as BCVWP}
              usePaddingForEditorContainer={usePaddingForEditorContainer}
              styles={styles}
            />
          </div>)}
    </>
  );
};

export default Workbench;
