import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  mapLinkEntityToServerAlignmentLink,
  ServerAlignmentLinkDTO,
  ServerLinksDTO
} from '../../common/data/serverAlignmentLinkDTO';
import { useDatabase } from '../../hooks/useDatabase';
import { JournalEntryTableName, LinksTable } from '../../state/links/tableManager';
import { Progress } from '../ApiModels';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';
import { ApiUtils } from '../utils';
import ResponseObject = ApiUtils.ResponseObject;

export interface SyncState {
  syncedAlignments?: AlignmentFile;
  progress: Progress;
  sync: (projectId?: string, controller?: AbortController) => Promise<boolean>;
  upload: (projectId?: string, controller?: AbortController) => Promise<ResponseObject<{}> | undefined>;
  dialog: any;
}

/**
 * hook to synchronize alignments. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncAlignments = (): SyncState => {
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const [syncedAlignments, setSyncedAlignments] = useState<AlignmentFile | undefined>();
  const abortController = useRef<AbortController | undefined>();
  const dbApi = useDatabase();

  const cleanupRequest = useCallback(() => {
    setProgress(Progress.CANCELED);
    abortController.current?.abort?.();
  }, []);

  const sendJournal = useCallback(async (signal: AbortSignal, projectId?: string) => {
    try {
      const journalEntriesToUpload = await dbApi.getAllJournalEntries(projectId!);
      await ApiUtils.generateRequest({
        requestPath: `/api/projects/${projectId}/alignment_links`,
        requestType: ApiUtils.RequestType.PATCH,
        signal,
        payload: journalEntriesToUpload
      });
      await dbApi.deleteByIds({
        projectId: projectId!,
        table: JournalEntryTableName,
        itemIdOrIds: journalEntriesToUpload.map((journalEntry) => journalEntry.id!)
      });
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
  }, [cleanupRequest, dbApi]);

  const fetchLinks = useCallback(async (signal: AbortSignal, projectId?: string) => {
    let resultLinks: ServerAlignmentLinkDTO[] = [];
    try {
      console.log("retrieving links")
      const { body: alignmentLinks } = await ApiUtils.generateRequest<ServerLinksDTO>({
        requestPath: `/api/projects/${projectId}/alignment_links`,
        requestType: ApiUtils.RequestType.GET,
        signal: abortController.current?.signal
      });
      resultLinks = alignmentLinks?.links ?? [];
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
    const newSyncedAlignments: AlignmentFile = {
      type: 'translation',
      meta: { creator: 'api' },
      records: resultLinks
        .map(l => ({
          meta: {
            id: l.id,
            origin: l.meta.origin,
            status: l.meta.status,
            note: l.meta.note
          },
          source: l.sources,
          target: l.targets
        } as AlignmentRecord))
    };
    setSyncedAlignments(newSyncedAlignments);
    cleanupRequest();
  }, [cleanupRequest]);

  const syncLinks = useCallback(async (alignmentProjectId?: string, controller?: AbortController) => {
    const signal = (controller ?? new AbortController()).signal;
    try {
      await sendJournal(signal, alignmentProjectId);
      await fetchLinks(signal, alignmentProjectId);
      return true;
    } catch (x) {
      console.error(x);
      return false;
    }
  }, [sendJournal, fetchLinks]);

  const uploadLinks = useCallback(async (alignmentProjectId?: string, controller?: AbortController) => {
    const signal = (controller ?? new AbortController()).signal;
    if (!alignmentProjectId) return;
    try {
      const linksTable = new LinksTable(alignmentProjectId);
      const linksInDb = (await linksTable.getAll())
        .map(mapLinkEntityToServerAlignmentLink);
      return await ApiUtils.generateRequest<{}>({
        requestPath: `/api/projects/${alignmentProjectId}/alignment_links`,
        requestType: ApiUtils.RequestType.POST,
        signal,
        payload: linksInDb
      });
    } catch (x) {
      console.error(x);
    }
  }, []);

  const dialog = useMemo(() => {
    return (
      <Dialog
        scroll="paper"
        open={![
          Progress.IDLE,
          Progress.SUCCESS,
          Progress.FAILED,
          Progress.CANCELED
        ].includes(progress)}
      >
        <Grid container alignItems="center" justifyContent="space-between"
              sx={{ minWidth: 500, height: 'fit-content', p: 2 }}>
          <CircularProgress sx={{ mr: 2, height: 10, width: 'auto' }} />
          <Typography variant="subtitle1">
            Syncing Alignments...
          </Typography>
          <Button variant="text" sx={{ textTransform: 'none', ml: 2 }} onClick={cleanupRequest}>Cancel</Button>
        </Grid>
      </Dialog>
    );
  }, [progress, cleanupRequest]);

  return {
    syncedAlignments: syncedAlignments,
    progress,
    sync: syncLinks,
    upload: uploadLinks,
    dialog
  };
};
