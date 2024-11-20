import { LinksTable } from './tableManager';
import { AlignmentFile } from '../../structs/alignmentFile';
import { LinkStatus, RepositoryLink } from '../../structs';

test('LinksTable#saveAlignmentFile', async () => {
  let saveAllReceived;
  const linksTable = new class extends LinksTable {
    saveAll = async (inputLinks: RepositoryLink[],
      suppressOnUpdate = false,
      isForced = false,
      disableJournaling = false,
      removeAllFirst = false): Promise<boolean> => {
      saveAllReceived = inputLinks;
      return true;
    }
  }('default');

  const alignmentFile: AlignmentFile = {
    meta: {
      creator: 'user1234'
    },
    type: '',
    records: [
      {
        meta: {
          id: '000-111-222-333',
          origin: 'machine',
          status: LinkStatus.APPROVED,
          note: []
        },
        source: [ '43003016005' ],
        target: [ '43003016002' ]
      },
      {
        meta: {
          id: '777-888-999',
          origin: 'human',
          status: LinkStatus.CREATED,
          note: []
        },
        source: [ '43003016006' ],
        target: [ '43003016003' ]
      }
    ]
  }

  await linksTable.saveAlignmentFile(
    alignmentFile,
    true,
    false,
    false,
    false,
    true);

  expect(saveAllReceived)
    .toStrictEqual([
      {
        id: '000-111-222-333',
        metadata: {
          origin: 'machine',
          status: LinkStatus.APPROVED,
          note: []
        },
        sources: [ '43003016005' ],
        targets: [ '43003016002' ]
      },
      {
        id: '777-888-999',
        metadata: {
          origin: 'human',
          status: LinkStatus.CREATED,
          note: []
        },
        sources: [ '43003016006' ],
        targets: [ '43003016003' ]
      }
    ]);
});
