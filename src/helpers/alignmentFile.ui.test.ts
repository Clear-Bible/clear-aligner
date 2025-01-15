import { checkAlignmentFile } from './alignmentFile';

test('minimal alignment file should pass parse check without errors', async () => {
  let result = checkAlignmentFile(
    `{
    "records": []
  }`,
    10
  );

  expect(result.errorMessages).toStrictEqual([]);
});

test('alignment file missing records should not pass parse check without errors', async () => {
  let result = checkAlignmentFile(
    `{
    "meta": {}
  }`,
    10
  );

  expect(result.errorMessages).toStrictEqual([
    'Input file has no alignment links (missing/empty "records" field).',
  ]);
});

test('alignment file with valid records should pass parse check without errors', async () => {
  let result = checkAlignmentFile(
    `{
    "meta": {
      "creator": "experimental machine"
    },
    "records": [
      {
        "meta": {
          "id": "000-111-222-333",
          "origin": "machine",
          "status": "approved"
        },
        "source": [ "43003016005" ],
        "target": [ "43003016002" ]
      }
    ]
  }`,
    10
  );

  expect(result.isFileValid).toBe(true);
  expect(result.errorMessages).toStrictEqual([]);
});
