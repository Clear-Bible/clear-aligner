import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppContext } from '../../App';
import { RepositoryLink } from '../../structs';
import { databaseHookDebug, LinksTable } from './tableManager';
import { BusyDialogContext } from '../../utils/useBusyDialogContext';

/**
 * Get all links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param projectId optional project name to specify
 * @param getKey Unique key to control get operation (optional; undefined = no get).
 */
export const useGetAllLinks = (projectId?: string, getKey?: string) => {
  const { projectState } = useContext(AppContext);
  const { setCustomStatus, setForceShowBusyDialog } = useContext(BusyDialogContext);
  const [status, setStatus] = useState<{
    result?: RepositoryLink[];
  }>({});
  const prevGetKey = useRef<string | undefined>();
  const linksTable = useMemo(() => {
    if (!projectId) {
      return projectState.linksTable;
    }
    return new LinksTable(projectId);
  }, [projectId, projectState.linksTable]);

  useEffect(() => {
    if (!getKey
      || prevGetKey.current === getKey) {
      return;
    }
    prevGetKey.current = getKey;
    setCustomStatus('Preparing links for export...');
    setForceShowBusyDialog(true)
    databaseHookDebug('useGetAllLinks(): status', status);
    linksTable.getAll()
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useGetAllLinks(): endStatus', endStatus);
      })
      .finally(() => setForceShowBusyDialog(false));
  }, [linksTable, prevGetKey, getKey, status, setCustomStatus, setForceShowBusyDialog]);

  return { ...status };
};
