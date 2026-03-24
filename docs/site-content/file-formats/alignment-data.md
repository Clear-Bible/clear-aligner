# Alignment Data

What is alignment data?

Alignment data describes the relationship between two bodies of text in terms of words, groups of words, or parts of words. ClearAligner defines a `json` format for alignment data. Alignment `json` files can be imported and exported.

The `json` alignment format allows for many tokens on either the `source` or `target` side. Tokens do not need to be contiguous and can cross BCV boundaries.

## Example

```json
{
  "type": "translation",
  "meta": {
    "creator": "ClearAligner"
  },
  "records": [
    {
      "meta": {
        "id": "d6820b2b-1a30-4247-a16f-18ed0c89b469",
        "origin": "manual",
        "status": "needsReview",
        "note": [
          {
            "note": "This is how a note is stored.",
            "id": "687280fd-386e-4263-bbab-de0373331086",
            "authorEmail": "name@domain.com"
          }
        ]
      },
      "source": [
        "40001001001"
      ],
      "target": [
        "40001001001",
        "40001001002",
        "40001001003",
        "40001001004"
      ]
    },
    {
      "meta": {
        "id": "6eb56565-e097-4108-9368-f9e2e715b5f0",
        "origin": "manual",
        "status": "created",
        "note": []
      },
      "source": [
        "40001001002"
      ],
      "target": [
        "40001001005",
        "40001001006",
        "40001001007"
      ]
    },
    {
      "meta": {
        "id": "ad64567f-b3c0-4e0e-9e8a-3a96ad1c621f",
        "origin": "manual",
        "status": "approved",
        "note": []
      },
      "source": [
        "40001001003"
      ],
      "target": [
        "40001001008",
        "40001001009"
      ]
    }
  ]
}
```

## Details

* The `id` field on alignment records is a GUID used for internal change tracking.
* Values for `source` arrays match the IDs in the canonical source text TSVs used by ClearAligner.
* Values for `target` arrays match the IDs provided in [target text](target-text.md) files.
* The `origin` field describes the type of process the alignment record originated from. `manual` is used for human-created records. A variety of other strings can describe automated processes. Values other than `manual` will be displayed with a sparkles icon.
* The `status` field describes the status of an alignment record. Supported statuses are `created`, `approved`, `rejected`, and `needsReview`.
* While many records can be stored in the `note` array, ClearAligner currently on supports a single note per alignment record.
