import { AlignmentFile } from '../../structs/alignmentFile';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../../App';
import { Project } from '../projects/tableManager';
import { databaseHookDebug, LinksTable } from './tableManager';

/**
 * Import alignment file hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param projectId project id of the alignment file to save
 * @param alignmentFile Alignment file to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 * @param suppressOnUpdate Suppress virtual table update notifications (optional; undefined = true).
 * @param suppressJournaling Suppress journaling
 * @param removeAllFirst Remove all records first, before adding new ones.
 * @param preserveFileIds whether id's of links in imported file should be preserved
 * @param fromServer whether to treat the imported file as if they're from a server
 */
export const useImportAlignmentFile = (
  projectId?: string,
  alignmentFile?: AlignmentFile,
  saveKey?: string,
  suppressOnUpdate = false,
  suppressJournaling = false,
  removeAllFirst = false,
  preserveFileIds = false,
  fromServer = false
) => {
  const { projectState, preferences, projects, setProjects } =
    React.useContext(AppContext);
  const project = useMemo<Project>(
    () => projects.find((p) => p.id === projectId)!,
    [projects, projectId]
  );
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const prevSaveKey = useRef<string | undefined>();
  const linksTable = useMemo(() => {
    if (!projectId || projectState.linksTable.getSourceName() === projectId) {
      return projectState.linksTable;
    }
    return new LinksTable(projectId);
  }, [projectId, projectState.linksTable]);

  useEffect(() => {
    if (!alignmentFile || !saveKey || prevSaveKey.current === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true,
    };
    setStatus(startStatus);
    prevSaveKey.current = saveKey;
    databaseHookDebug('useImportAlignmentFile(): startStatus', startStatus);
    linksTable
      .saveAlignmentFile(
        alignmentFile,
        suppressOnUpdate,
        false,
        suppressJournaling,
        removeAllFirst,
        preserveFileIds
      )
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false,
        };
        setStatus(endStatus);
        if (!fromServer) {
          project &&
            projectState?.projectTable
              ?.updateLastUpdated?.(project)
              ?.then((result) => {
                if (result) {
                  setProjects((projects) =>
                    projects.map((p) => {
                      if (p.id !== result.id) return p;
                      return {
                        ...p,
                        updatedAt: result.updatedAt,
                      };
                    })
                  );
                }
              })
              ?.catch?.(console.error);
        }
        databaseHookDebug('useImportAlignmentFile(): endStatus', endStatus);
      });
  }, [
    preserveFileIds,
    project,
    linksTable,
    prevSaveKey,
    alignmentFile,
    saveKey,
    status,
    suppressOnUpdate,
    projects,
    setProjects,
    preferences?.currentProject,
    projectState?.projectTable,
    suppressJournaling,
    removeAllFirst,
    fromServer,
  ]);

  return { ...status };
};
