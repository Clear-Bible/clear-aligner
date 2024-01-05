# ClearAligner

ClearAligner is a tool for working with Biblical alignment data.

[View Demo](https://clear-aligner.netlify.app/).

Note: documentation below will need updating.

## Consuming Application Quickstart

- Install: `npm install treedown-aligner`
- Import: `import TreedownAligner from 'treedown-aligner';`
- Render: `() => { return <TreedownAligner /> }` (see below for proper usage)

### Note: expected peer dependencies

The following peer dependencies are required:

- `react`
- `react-dom`

The component currently supports react v18.x.

## Local development Quickstart

- Install dependencies: `source ./setup.sh`
- Build: `yarn build`
    - build for Windows: `yarn build:win`
    - build for Mac: `yarn build:mac`
- Run electron in dev mode: `yarn dev-electron`
    - **Note:** `yarn start` _will not work_, due to the use of platform-specific
      libraries (sqlite3) and main/renderer process IPC.

### Install electron build dependencies on Ubuntu 22.04

```bash
sudo apt-get install build-essential clang libdbus-1-dev libgtk-3-dev \
                       libnotify-dev libasound2-dev libcap-dev \
                       libcups2-dev libxtst-dev \
                       libxss1 libnss3-dev gcc-multilib g++-multilib curl \
                       gperf bison python3-dbusmock openjdk-8-jre \
                       libfuse2 sqlite3 python3 python3-regex
```

### Run Electron AppImage on Ubuntu 20.04+ - requires fuse

- requires `libfuse2` package

## The Template, Default, and User Databases

These database files are the basis of all project databases and included with the platform
builds. These files are:

```
sql/clear-aligner-template.sqlite
sql/clear-aligner-user.sqlite
sql/projects/clear-aligner-default.sqlite
```

...in the project directory during development and the application footprint after
installation.

These are created automatically when executing `yarn dev-electron` or any of the
`yarn build*` commands, including the platform builds. These build steps will
_only_ create these files when they're missing. These may be manually recreated at
any time by executing the following shell script:

```
sql/create-db.sh
```

This script requires Python3 installed and the corpora TSV files to be in `src/tsv`.

## Basic Usage

After install, import the react component:

```js
import TreedownEditor from 'treedown-aligner';
```

In your render function, include the component with some props:

```js
<TreedownEditor
  theme="day"
  corpora={[<...>]}
  alignments={[<...>]}
  alignmentUpdated={(newAlignmentData) => {
    // persist alignment data here
  }}
/>
```

## Properties and Options

### `theme`

`string: 'day' | 'night'`

specifies which css theme is used.

### `localizationCode`

`string`

NOT YET IMPLEMENTED

The consuming application can provide a `localizationCode` that component will conform internationalized UI elements to.
The [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data) is expected. Supported languages are:

- English (eng)
- something else here...
- something else here...

### `corpora`

`Corpus[]`

_Corpora_ is the plural form of corpus. A corpus is one body of text that the user will interact with when using this
component. Up to 4 corpus entities can be supplied.

A `Corpus` looks like:

```ts
interface Corpus {
  id: string;
  name: string;
  fullName: string;
  language: string;

  words: Word[];
  fullText?: string;
  viewType?: CorpusViewType;
  syntax?: SyntaxRoot;
}
```

- `id: string` unique identifier for the corpus
- `name: string` short name, like `NIV`
- `fullName` long name, like `New International Version`
- `language` language code via [ISO 639-3](https://iso639-3.sil.org/code_tables/639/data)
- `words: Word[]` object representing a word in the corpus. See [`Word`](#word) below.
- `fullText?: string` _optional_ - full unsegmented text of the corpus
- `syntax?: SyntaxRoot` _optional_ - syntactic parsing of the corpus. See [`SyntaxRoot`](#syntaxroot) below.

#### `Word`

`Word` is an object representing a word in a corpus. In English, words are surrounded by whitespace, but in other
languages not neccesarily.

A `Word` looks like:

```ts
export interface Word {
  id: string;
  corpusId: string;

  text: string;
  position: number;
}
```

- `id: string` unique indetifier. used to correlate with [`Alignment`](#alignments) data
- `corpusId: string` unique identifier of the corpus the words belongs to
- `text: string` content of the word
- `position: number` sequential position of the word in the corpus

#### `SyntaxRoot`

In some use cases, one of the supplied corpora can have syntax data. In this case, "Syntax data" is a tree-like
structure denoting words, word groups, and their relationships to other. The component current supports a json
representation of [Lowfat Syntax XML](https://github.com/Clear-Bible/macula-greek/tree/main/Nestle1904/lowfat).

`Note`: The component could recieve lowfat xml in string form and then internally convert to json structure. This may be
preferable.

### `alignments`

`Alignment[]`

An `Alignment` is a set of data the describes the relationship between two corpora. The component enables users to view
and modify alignment data. It also uses alignment data to generate syntactic views
in [treedown](http://jonathanrobie.biblicalhumanities.org/blog/2017/05/12/lowfat-treebanks-visualizing/) notation.

```ts
interface Alignment {
  source: string;
  target: string;
  polarity: AlignmentPolarity;
  links: Link[];
}
```

- `source: string` id of the source corpus
- `target: string` id of the target corpus
- `polarity: AlignmentPolarity` describes the directionality of the alignment
  see [`AlignmentPolarity`](#alignmentpolarity) below.
- `links: Link[]` relationship entities between the two corpora. see [`Links`](#links)

#### `AlignmentPolarity`

An `AlignmentPolarity` describes the "sides" of an alignment and their attributes.
Each alignment dataset much be specified with either a `PrimaryAlignmentPolarity` or a `SecondaryAlignmentPolarity`.

```ts
interface PrimaryAlignmentPolarity {
  type: 'primary';
  syntaxSide: 'sources' | 'targets';
  nonSyntaxSide: 'sources' | 'targets';
}
```

- `type: 'primary'`
- `syntaxSide: 'sources' | 'targets'`
- `nonSyntaxSide: 'sources' | 'targets'`

```ts
interface SecondaryAlignmentPolarity {
  type: 'secondary';
  mappedSide: 'sources' | 'targets';
  nonMappedSide: 'sources' | 'targets';
}
```

- `type: 'secondary'`
- `mappedSide: 'sources' | 'targets'`
- `nonMappedSide: 'sources' | 'targets'`

#### Links

`Link[]`

A `Link` is a single instance of alignment data. It describes the relationship between the words of two corpora. The
strings on either side of the link are IDs of words that were cpecified in the provided `Corpus[]`. There can be one or
many words on either side of a `Link`.

```ts
export interface Link {
  _id?: string;
  sources: string[];
  targets: string[];
}
```

- [wip] `_id?: string` unqiue indentifier for the link. probably should just generate internally
- `sources: string[]` array of Word IDs on the source side of the link
- `targets: string[]` array of Word IDs on the target side of the link

### `alignmentUpdated`

This is function provided by the consuming application that is called when a user saves alignment data. At the time of
invocation, the current alignment state is passed to the function which can be used to display, send, or persist the
user's alignment data.
