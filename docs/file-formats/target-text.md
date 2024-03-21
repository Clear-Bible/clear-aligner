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

### \`id\` Column

The `id` column should contain BCVW values correlating to the target text's native versification:

* **Book**: 2 characters
* **Chapter**: 3 characters
* **Verse**: 3 characters
* **Word**: 3 characters

### \`source\_verse\` Column

The `source_verse` column should contain BCV correlating to the source text versification (often referred to as `org`).&#x20;

#### What is this column for?

Bible editions may use different approaches to identify the same verse content. For example,  most English Bibles identify Malachi’s statement, “Behold, I will send you Elijah the prophet before the great and awesome day of the LORD comes.” as Malachi chapter 4, verse 5. However, Hebrew Bibles designate this content as Mal 3:23. These schemes are called the _versification_ of the Bible, and there are several common systems and ways to map between them.

ClearAligner allows users to navigate scripture via a versification scheme that is native to the target text. The `source_verse` column maps targets tokens in to source (aka `org`) versification scheme.

### \`text\` Column

The `text` column should contain UTF-8 tokens representing the text to be aligned.
