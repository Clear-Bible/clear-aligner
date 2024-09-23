import { renderHook, act } from '@testing-library/react-hooks/dom'
import { mockDatabaseApi, mockEnvironmentVars } from '../../__tests__/mockElectron';

mockEnvironmentVars();
mockDatabaseApi();

import { SyncProgress, useSyncProject } from './useSyncProject';
import { Project } from '../../state/projects/tableManager';
import { mockContext, mockContextWithWrapper } from '../../__tests__/mockContext';
import { mockProjectState } from '../../__tests__/mockModules/mockProjectState';
import { mockPreferences } from '../../__tests__/mockModules/mockPreferences';

test('useSyncProject:correctProject', async () => {
  const expectedSourceName = 'abcdefg';

  const ctx = mockContext({
    preferences: mockPreferences({
      currentProject: expectedSourceName
    }),
    projectState: mockProjectState({
    })
  });
  const wrapper = mockContextWithWrapper(ctx);
  const {
    result,
    rerender,
    waitForValueToChange
  } = renderHook(() => useSyncProject(), { wrapper });

  const project = {
    id: expectedSourceName,
  } as Project;

  result.current.sync(project);

  // assert that the state has been properly modified to the initial state
  expect(result.current.progress).toBe(SyncProgress.REFRESHING_PERMISSIONS);

  // perform second render loop
  //rerender();
  await waitForValueToChange(() => result.current.progress === SyncProgress.SWITCH_TO_PROJECT);

  rerender();

  expect(result.current.progress).toBe(SyncProgress.SYNCING_PROJECT);
  //await waitForValueToChange(() => result.current.progress === SyncProgress.SYNCING_PROJECT);
});

test('useSyncProject:incorrectProject', async () => {
  const ctx = mockContext({
    projectState: mockProjectState({
    })
  });
  const wrapper = mockContextWithWrapper(ctx);
  const {
    result,
    rerender,
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
