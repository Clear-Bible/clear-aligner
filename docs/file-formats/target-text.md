---
description: ClearAligner's TSV file format.
---

# Target Text

ClearAligner uses a simple `TSV` file format to describe tokenized texts. Starting a project is as easy as importing a TSV file representing the text. The required columns are `id`, `text`, and `source_verse`. UTF-8 encoding is expected.&#x20;

## How do I generate a TSV for my project?

We have created [a toolkit called Kathairo for generating TSVs from USFM](https://github.com/Clear-Bible/kathairo.py). We also have a [public repository that contains checked TSVs for openly-licensed texts](https://github.com/Clear-Bible/Open-Bible-TSVs). If find a problem with an existing TSV or need help generating a new one, [create an issue here](https://github.com/Clear-Bible/Open-Bible-TSVs/issues).&#x20;

## What does ClearAligner's TSV format look like?

## Example

<table><thead><tr><th>id</th><th width="132">source_verse</th><th width="121">text</th><th width="194">skip_space_after</th><th>exclude</th></tr></thead><tbody><tr><td>01001001001</td><td>01001001</td><td>Hapo</td><td></td><td></td></tr><tr><td>01001001002</td><td>01001001</td><td>mwanzo</td><td></td><td></td></tr><tr><td>01001001003</td><td>01001001</td><td>Mungu</td><td></td><td></td></tr><tr><td>01001001004</td><td>01001001</td><td>aliumba</td><td></td><td></td></tr><tr><td>01001001005</td><td>01001001</td><td>mbingu</td><td></td><td></td></tr><tr><td>01001001006</td><td>01001001</td><td>na</td><td></td><td></td></tr><tr><td>01001001007</td><td>01001001</td><td>dunia</td><td>y</td><td></td></tr><tr><td>01001001008</td><td>01001001</td><td>.</td><td></td><td>y</td></tr></tbody></table>

## Details

### Column:  \`id\`&#x20;

The `id` column should contain BCVW values correlating to the target text's native versification:

* **Book**: 2 characters
* **Chapter**: 3 characters
* **Verse**: 3 characters
* **Word**: 3 characters

### Column: \`source\_verse\`

The `source_verse` column should contain BCV correlating to the source text versification (often referred to as `org`).&#x20;

#### What is this column for?

Bible editions may use different approaches to identify the same verse content. For example,  most English Bibles identify Malachi’s statement, “Behold, I will send you Elijah the prophet before the great and awesome day of the LORD comes.” as Malachi chapter 4, verse 5. However, Hebrew Bibles designate this content as Mal 3:23. These schemes are called the _versification_ of the Bible, and there are several common systems and ways to map between them.

ClearAligner allows users to navigate scripture via a versification scheme that is native to the target text. The `source_verse` column maps targets tokens in to source (aka `org`) versification scheme.

### Column: \`text\`

The `text` column should contain UTF-8 tokens representing the text to be aligned.

### Column: \`skip\_space\_after\`

The `skip_space_after`column is used to correctly render spaces between tokens when displaying the text. If empty, ClearAligner assumes a falsy value. If value `y`is present, the result is truthy.

### Column: \`exclude\`

The`exclude`column is used to mark tokens that should be displayed (for correct rendering of the text) but cannot be aligned. If empty, ClearAligner assumes a falsy value. If value `y`is present, the token will be displayed but cannot be aligned. It is common to exclude punctuation tokens from alignment.
