import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import React, { useCallback, useRef, useState } from 'react';
import { ServerAlignmentLinkDTO } from '../../common/data/serverAlignmentLinkDTO';
import { generateJsonString } from '../../common/generateJsonString';
import { useDatabase } from '../../hooks/useDatabase';
import { JournalEntryTableName } from '../../state/links/tableManager';
import { JournalEntryDTO, mapJournalEntryEntityToJournalEntryDTO } from '../../common/data/journalEntryDTO';
import {
  ClearAlignerApi,
  getApiOptionsWithAuth,
  JournalEntryUploadChunkSize,
  OverrideCaApiEndpoint
} from '../../server/amplifySetup';
import { get, patch } from 'aws-amplify/api';
import _ from 'lodash';
import { Progress } from '../ApiModels';
import { Button, CircularProgress, Dialog, Grid, Typography } from '@mui/material';

export interface SyncState {
  file?: AlignmentFile;
  progress: Progress;
  sync: (projectId?: string, controller?: AbortController) => Promise<unknown>;
  dialog: any;
}

const mapJournalEntryEntityToJournalEntryDTOHelper = (journalEntry: any): JournalEntryDTO => mapJournalEntryEntityToJournalEntryDTO(journalEntry);

/**
 * hook to synchronize alignments. Updating the syncLinksKey or cancelSyncKey will perform that action as in our other hooks.
 */
export const useSyncAlignments = (): SyncState => {
  const [progress, setProgress] = useState<Progress>(Progress.IDLE);
  const [file, setFile] = useState<AlignmentFile | undefined>();
  const abortController = useRef<AbortController | undefined>();
  const dbApi = useDatabase();

  const cleanupRequest = React.useCallback(() => {
    setProgress(Progress.CANCELED);
    abortController.current?.abort?.();
  }, []);

  const sendJournal = useCallback(async (signal: AbortSignal, projectId?: string) => {
    const journalEntries = (await dbApi.getAll(projectId!, JournalEntryTableName))
      .map(mapJournalEntryEntityToJournalEntryDTOHelper);
    try {
      const requestPath = `/api/projects/${projectId}/alignment_links/`;
      if (OverrideCaApiEndpoint) {
        await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
          signal,
          method: 'PATCH',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
          body: generateJsonString(journalEntries)
        });
      } else {
        for (const journalEntryChunk of _.chunk(journalEntries, JournalEntryUploadChunkSize)) {
          const responseOperation = patch({
            apiName: ClearAlignerApi,
            path: requestPath,
            options: getApiOptionsWithAuth(journalEntryChunk)
          });
          signal.onabort = () => {
            responseOperation.cancel();
          };
          await responseOperation.response;
        }
      }
      await dbApi.deleteAll({
        sourceName: projectId!,
        table: JournalEntryTableName
      });
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
  }, [cleanupRequest, dbApi]);

  const fetchLinks = useCallback(async (signal: AbortSignal, projectId?: string) => {
    let response;
    try {
      const requestPath = `/api/projects/${projectId}/alignment_links/`;
      if (OverrideCaApiEndpoint) {
        response = (await fetch(`${OverrideCaApiEndpoint}${requestPath}`, {
          signal,
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json'
          },
        })).json();
      } else {
        const responseOperation = get({
          apiName: ClearAlignerApi,
          path: requestPath,
          options: getApiOptionsWithAuth()
        });
        signal.onabort = () => {
          responseOperation.cancel();
        };
        response = (await responseOperation.response).body.json();
      }
    } catch (x) {
      cleanupRequest();
      throw new Error('Aborted');
    }
    const linksBody: {
      links: ServerAlignmentLinkDTO[]
    } = await response;
    const tmpFile = {
      type: 'translation',
      meta: { creator: 'api' },
      records: linksBody.links
        .map(l => ({
          meta: {
            id: l.id,
            origin: l.meta.origin,
            status: l.meta.status
          },
          source: l.sources,
          target: l.targets
        } as AlignmentRecord))
    };
    setFile(tmpFile);
    cleanupRequest();
  }, [cleanupRequest]);

  const syncLinks = useCallback(async (alignmentProjectId?: string, controller?: AbortController) => {
    const signal = (controller ?? new AbortController()).signal;
    try {
      await sendJournal(signal, alignmentProjectId);
      await fetchLinks(signal, alignmentProjectId);
      return true;
    } catch (x) {
    }
  }, [sendJournal, fetchLinks]);

  const dialog = React.useMemo(() => {
    return (
      <Dialog
        scroll="paper"
        open={![
          Progress.IDLE,
          Progress.SUCCESS,
          Progress.FAILED,
          Progress.CANCELED
        ].includes(progress)}
        onClose={cleanupRequest}
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
    file,
    progress,
    sync: syncLinks,
    dialog
  };
};