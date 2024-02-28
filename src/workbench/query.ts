import { AlignmentSide, Corpus, CorpusContainer, CorpusFileFormat, TextDirection, Verse, Word } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';

// @ts-ignore
import MACULA_SBLGNT from 'tsv/source_macula_greek_SBLGNT.tsv';
// @ts-ignore
import MACULA_HEBOT_TSV from 'tsv/source_macula_hebrew.tsv';
// @ts-ignore
import YLT from 'tsv/ylt-new.tsv';

let isInitialized: boolean = false;

const availableCorpora: CorpusContainer[] = [];

const punctuationFilter = [
  ',',
  '.',
  '[',
  ']',
  ':',
  '‘',
  '’',
  '—',
  '?',
  '!',
  ';',
  'FALSE',
  '(',
  ')',
  'TRUE',
  '"',
  '“',
  '”',
  "،",
  "؟",
  "؛"
];

const parseTsvByFileType = async (
  tsv: RequestInfo,
  refCorpus: Corpus,
  side: AlignmentSide,
  fileType: CorpusFileFormat
): Promise<Partial<Corpus>> => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  const [header, ...rows] = response.split('\n');
  const headerMap: Record<string, number> = {};
  const wordsByVerse: Record<string, Verse> = {};

  header.split('\t').forEach((header, idx) => {
    header = header === 'identifier' ? 'id' : header; //Standard for header in files will be id
    headerMap[header] = idx;
  });
  const hasGloss = !!(headerMap["english"] ?? headerMap["gloss"]);

  const reducedWords = rows.reduce((accumulator, row) => {
    const values = row.split('\t');

    let id, pos, word: Word, verse;
    switch (fileType) {
      case CorpusFileFormat.TSV_TARGET:
        // filter out punctuation in content
        if (
          punctuationFilter.includes(values[headerMap['token']]) ||
          punctuationFilter.includes(values[headerMap['text']])
        ) {
          // skip punctuation
          return accumulator;
        }

        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['id']];
        if (!BCVWP.isValidString(id)) {
          return accumulator;
        }
        pos = +id.substring(8, 11); // grab word position
        word = {
          id: id, // standardize n40001001002 to  40001001002
          side,
          corpusId: refCorpus.id,
          text: values[headerMap['text']] || values[headerMap['lemma']] || '',
          position: pos
        };
        verse = wordsByVerse[id.substring(0, 8)] || {};
        wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          sourceVerse: values[headerMap['source_verse']],
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word]),
        };
        accumulator.push(word);
        break;

      case CorpusFileFormat.TSV_MACULA:
      default: // grab word position
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11);
        // Gloss is defined at this level since both english and gloss headers can exist.
        // Either could be null within the TSV file.
        const gloss = values[headerMap["english"]] || values[headerMap["gloss"]] || "-";

        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
          side,
          text: values[headerMap['text']] || values[headerMap['lemma']] || '',
          after: values[headerMap['after']],
          position: pos,
          gloss: (new RegExp(/^(.+\..+)+$/)).test(gloss)
            ? gloss.replaceAll(".", " ")
            : gloss
        } as Word;

        verse = wordsByVerse[id.substring(0, 8)] || {};
        wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word]),
        };
        accumulator.push(word);
        break;
    }

    return accumulator;
  }, [] as Word[]);
  return {
    words: reducedWords,
    wordsByVerse,
    hasGloss
  };
};

const putVerseInCorpus = (corpus: Corpus, verse: Verse) => {
  if (!(verse.bcvId.book && verse.bcvId.chapter && verse.bcvId.verse)) {
    return;
  }
  if (!corpus.books) {
    corpus.books = {};
  }
  if (!corpus.books[verse.bcvId.book]) {
    corpus.books[verse.bcvId.book] = {};
  }
  const bookRef = corpus.books[verse.bcvId.book];
  if (!bookRef[verse.bcvId.chapter]) {
    bookRef[verse.bcvId.chapter] = {};
  }
  const chapterRef = bookRef[verse.bcvId.chapter];
  chapterRef[verse.bcvId.verse] = verse;
};

const putVersesInCorpus = (corpus: Corpus) => {
  Object.values(corpus.wordsByVerse).forEach((verse) =>
    putVerseInCorpus(corpus, verse)
  );
};

export const getAvailableCorporaContainers = async (): Promise<
  CorpusContainer[]
> => {
  if (!isInitialized) {
    isInitialized = true;
    // Macula Hebrew OT
    let maculaHebOT: Corpus = {
      id: 'wlc-hebot',
      name: 'WLC',
      fullName: 'Macula Hebrew Old Testament',
      language: {
        code: 'heb',
        textDirection: TextDirection.RTL,
        fontFamily: 'sbl-hebrew',
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };
    const maculaHebOTWords = await parseTsvByFileType(
      MACULA_HEBOT_TSV,
      maculaHebOT,
      'sources',
      CorpusFileFormat.TSV_MACULA
    );

    maculaHebOT = {
      ...maculaHebOT,
      ...maculaHebOTWords,
    };
    putVersesInCorpus(maculaHebOT);

    // SBL GNT
    let sblGnt: Corpus = {
      id: 'sbl-gnt',
      name: 'SBLGNT',
      fullName: 'SBL Greek New Testament',
      language: {
        code: 'grc',
        textDirection: TextDirection.LTR,
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };

    const sblWords = await parseTsvByFileType(
      MACULA_SBLGNT,
      sblGnt,
      'sources',
      CorpusFileFormat.TSV_MACULA
    );
    sblGnt = {
      ...sblGnt,
      ...sblWords,
    };
    putVersesInCorpus(sblGnt);

    let yltCorp: Corpus = {
      id: 'ylt',
      name: 'YLT',
      fullName: 'YLT',
      language: {
        code: 'eng',
        textDirection: TextDirection.LTR,
      },
      words: [],
      wordsByVerse: {},
      books: {},
    };

    const ytlWords = await parseTsvByFileType(
      YLT,
      yltCorp,
      'targets',
      CorpusFileFormat.TSV_TARGET
    );

    yltCorp = {
      ...yltCorp,
      ...ytlWords,
    };

    putVersesInCorpus(yltCorp);

    const sourceContainer = CorpusContainer.fromIdAndCorpora('source', [
      sblGnt,
      maculaHebOT,
    ]);
    const targetContainer = CorpusContainer.fromIdAndCorpora('target', [
      yltCorp,
    ]);

    availableCorpora.push(sourceContainer);
    availableCorpora.push(targetContainer);
  }

  return availableCorpora;
};

export const getAvailableCorporaIds = async (): Promise<string[]> => {
  return (
    isInitialized ? availableCorpora : await getAvailableCorporaContainers()
  ).map((corpus) => {
    return corpus.id;
  });
};
