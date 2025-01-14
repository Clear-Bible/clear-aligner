import {
  mockContext,
  mockContextWithWrapper,
} from '../../__tests__/mockContext';
import { mockProjectState } from '../../__tests__/mockModules/mockProjectState';
import { renderHook } from '@testing-library/react';
import { useImportAlignmentFile } from './useImportAlignmentFile';
import { ProjectLocation } from '../../common/data/project/project';
import { LinksTable } from './tableManager';
import { AlignmentFile } from '../../structs/alignmentFile';
import { LinkOriginManual, LinkStatus } from '../../structs';

test('useImportAlignmentFile:', async () => {
  let saveAlignmentFileCalled: boolean = false;
  let receivedAlignmentFile: AlignmentFile | undefined = undefined;
  const ctx = mockContext({
    projectState: mockProjectState({
      linksTable: new (class extends LinksTable {
        saveAlignmentFile = async (
          alignmentFile: AlignmentFile,
          suppressOnUpdate = false,
          isForced = false,
          disableJournaling = false,
          removeAllFirst = false,
          preserveFileIds = false
        ) => {
          saveAlignmentFileCalled = true;
          receivedAlignmentFile = alignmentFile;
        };
      })('1234'),
    }),
    projects: [
      {
        id: '1234',
        name: 'sample',
        abbreviation: 'smp',
        languageCode: 'eng',
        textDirection: 'ltr',
        fileName: 'bsb.tsv',
        location: ProjectLocation.LOCAL,
      },
    ],
  });

  const alignmentFile: AlignmentFile = {
    meta: {
      creator: 'ClearAligner',
    },
    type: 'translation',
    records: [
      {
        meta: {
          id: '00001cdc-ae97-4ccf-8b5d-9ba92d7c2ef6',
          origin: LinkOriginManual,
          status: LinkStatus.CREATED,
          note: [],
        },
        source: ['270080160121'],
        target: ['27008016031'],
      },
      {
        meta: {
          id: '00002f17-45bf-4f0b-ac65-2dae82458b70',
          origin: LinkOriginManual,
          status: LinkStatus.CREATED,
          note: [],
        },
        source: ['43019027010'],
        target: ['43019027016'],
      },
    ],
  };

  const wrapper = mockContextWithWrapper(ctx);
  const { result } = renderHook(
    () => useImportAlignmentFile('1234', alignmentFile, 'key'),
    { wrapper }
  );
  expect(saveAlignmentFileCalled).toBeTruthy();
  expect(receivedAlignmentFile).toStrictEqual(alignmentFile);
});
