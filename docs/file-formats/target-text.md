---
description: ClearAligner's TSV file format.
---

# Target Text

ClearAligner uses a simple `TSV` file format to describe tokenized texts. As of version `0.0.27`, you can import and text modeled as tabular data. The required columns are `id`, `text`, and `source_verse`. UTF-8 encoding is expected. There is currently no way to model punctuation in these files (see Open Issues).

During pilot testing, the Clear team will provide target TSVs to users working with alignment data.

## Example

| id          | source\_verse | text      |
| ----------- | ------------- | --------- |
| 01001001001 | 01001001      | In        |
| 01001001002 | 01001001      | the       |
| 01001001003 | 01001001      | beginning |

## Details

The `id` column should contain BCVW values correlating to the target text's native versification:

* **Book**: 2 characters
* **Chapter**: 3 characters
* **Verse**: 3 characters
* **Word**: 3 characters

The `source_verse` column should contain BCV correlating to the source text versification (often referred to as `org`). What is this column for? ClearAligner allows users to navigate scripture via a versification scheme that is native to the target text. The `source_verse` column maps targets tokens in to source (aka `org`) versification scheme.

The `text` column should contain UTF-8 tokens.

