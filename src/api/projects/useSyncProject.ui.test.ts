import { renderHook } from '@testing-library/react-hooks/dom';
import { mockDatabaseApi, mockDatabaseApiOnWindow, mockEnvironmentVarsOnWindow } from '../../__tests__/mockElectron';
import React from 'react';
import {
  stepSwitchToProject, stepSyncingAlignments,
  stepSyncingCorpora,
  stepSyncingProject, stepUpdatingProject,
  SyncProgress,
  useSyncProject
} from './useSyncProject';
import { Project, ProjectTable } from '../../state/projects/tableManager';
import { mockContext, mockContextWithWrapper } from '../../__tests__/mockContext';
import { mockProjectState } from '../../__tests__/mockModules/mockProjectState';
import { mockPreferences, mockSetPreferences } from '../../__tests__/mockModules/mockPreferences';
import { UserPreference } from '../../state/preferences/tableManager';
import { InitializationStates } from '../../workbench/query';
import { mockContainers } from '../../__tests__/mockModules/corpora';
import { ProjectTokenReport } from './useSyncWordsOrParts';
import { mockSetStateAction } from '../../__tests__/mockModules/react';

mockEnvironmentVarsOnWindow();
mockDatabaseApiOnWindow();

test('useSyncProject:incorrectProject', async () => {
  const ctx = mockContext({
    projectState: mockProjectState({
    })
  });
  const wrapper = mockContextWithWrapper(ctx);
  const {
    result,
    waitForNextUpdate
  } = renderHook(() => useSyncProject(), { wrapper });

  const expectedSourceName = 'abcdefg';

  const project = {
    id: expectedSourceName,
  } as Project;

  result.current.sync(project);

  await waitForNextUpdate();

  // assert that the state has been properly modified to the initial state
  expect(result.current.progress).toBe(SyncProgress.SWITCH_TO_PROJECT);
});

test('useSyncProject:stepSwitchToProject', async () => {
  let progress = SyncProgress.SWITCH_TO_PROJECT;
  const mockSetProgress = (p: SyncProgress) => progress = p;
  const project = {
    id: '1234'
  } as Project;
  let prefs = mockPreferences({
    currentProject: '1234',
    initialized: InitializationStates.INITIALIZED
  });
  await stepSwitchToProject(
    progress,
    mockSetProgress,
    prefs,
    mockSetPreferences(prefs, (p: UserPreference) => prefs = p),
    project,
    mockProjectState());
  expect(progress).toBe(SyncProgress.SYNCING_PROJECT);
});

test('useSyncProject:stepSyncingProject', async () => {
  let progress = SyncProgress.SYNCING_PROJECT;
  const mockSetProgress = (p: SyncProgress) => progress = p;
  const project = {
    id: '1234'
  } as Project;
  await stepSyncingProject(
    progress,
    mockSetProgress,
    project,
    undefined as any as React.MutableRefObject<AbortController|undefined>,
    (s: boolean) => undefined,
    (s: boolean) => undefined,
    () => undefined);
  expect(progress).toBe(SyncProgress.SYNCING_CORPORA);
});

test('useSyncProject:stepSyncingCorpora', async () => {
  let progress = SyncProgress.SYNCING_PROJECT;
  const mockSetProgress = (p: SyncProgress) => progress = p;
  const project = {
    id: '1234',
    sourceCorpora: {
      corpora: []
    },
    targetCorpora: {
      corpora: [ {
          words: [
            { id: '100100100' }
          ]
        } ]
    }
  } as unknown as Project;

  const containersMock = mockContainers({
    projectId: project.id,
  });
  let mockSyncWordsOrPartsInvoked = false;

  await stepSyncingCorpora(
    progress,
    mockSetProgress,
    project,
    containersMock,
    () => undefined,
    () => undefined,
    async (project, side) => {
      mockSyncWordsOrPartsInvoked = true;
      return {
        success: true,
        response: {
          statusCode: 200
        },
        body: {} as ProjectTokenReport
      }
    }
  );

  expect(progress).toBe(SyncProgress.SYNCING_ALIGNMENTS);
  expect(mockSyncWordsOrPartsInvoked).toBeTruthy();
});

test('useSyncProject:stepSyncingAlignments', async () => {
  let progress = SyncProgress.SYNCING_PROJECT;
  const mockSetProgress = (p: SyncProgress) => progress = p;

  const project = {
    id: '1234',
    sourceCorpora: {
      corpora: []
    },
    targetCorpora: {
      corpora: [ {
        words: [
          { id: '100100100' }
        ]
      } ]
    }
  } as unknown as Project;

  let mockUploadAlignmentsCalled = false;

  const mockUploadAlignments = async (projectId?: string, controller?: AbortController) => {
    mockUploadAlignmentsCalled = true;
    return undefined;
  }

  let mockSyncAlignmentsCalled = false;

  const mockSyncAlignments = async (projectId?: string, controller?: AbortController) => {
    mockSyncAlignmentsCalled = true;
    return true;
  }

  await stepSyncingAlignments(
    progress,
    mockSetProgress,
    project,
    () => undefined,
    () => undefined,
    mockUploadAlignments,
    mockSyncAlignments);

  expect(progress).toBe(SyncProgress.UPDATING_PROJECT);
  expect(mockSyncAlignmentsCalled).toBeTruthy();
  expect(mockUploadAlignmentsCalled).toBeFalsy();
});

test('useSyncProject:stepUpdatingProject', async () => {
  let progress = SyncProgress.SYNCING_PROJECT;
  const mockSetProgress = (p: SyncProgress) => progress = p;

  const project = {
    id: '1234'
  } as Project;

  await stepUpdatingProject(
    progress,
    mockSetProgress,
    project,
    mockDatabaseApi(),
    async (p, s) => undefined,
    mockProjectState({
      projectTable: {
        sync: async (project) => true
      } as ProjectTable
    }),
    mockSetStateAction());

  expect(progress).toBe(SyncProgress.IDLE);
});
