---
description: What is alignment data?
---

# Alignment Data

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
      "id": "a2a39b94-2093-4ddf-a584-8780828ebf1d",
      "source": [
        "40005003001"
      ],
      "target": [
        "40005003001"
      ]
    },
    {
      "id": "949db553-41cf-4137-ba17-dfeff7d43c6b",
      "source": [
        "40005003002",
        "40005003003"
      ],
      "target": [
        "40005003002",
        "40005003003"
      ]
    }
  ]
}
```

## Details

The `id` field on alignment records is a `GUID` used for internal change tracking.

Values for `source` arrays match the IDs in the canonical source text TSVs used by ClearAligner.

Values for `target` arrays match the IDs provided in [target text](target-text.md) files.&#x20;
