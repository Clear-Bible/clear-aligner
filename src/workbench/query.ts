/**
 * This file contains helper functions for interacting with the Corpus
 */
import { Corpus, CorpusContainer, CorpusFileFormat, Verse, Word } from 'structs';
import BCVWP from '../features/bcvwp/BCVWPSupport';
import { EmptyWordId } from 'state/links/tableManager';
import { AppContextProps } from '../App';
import { Containers } from '../hooks/useCorpusContainers';
import { DatabaseApi } from '../hooks/useDatabase';
import { AlignmentSide } from '../common/data/project/corpus';

export enum InitializationStates {
  UNINITIALIZED,
  INITIALIZING,
  INITIALIZED
}

let IsLoadingAnyCorpora = false;

// @ts-ignore
const dbApi = window.databaseApi as DatabaseApi;

export const isLoadingAnyCorpora = () => IsLoadingAnyCorpora;

/*
 function that handles any input from the exclude column in the tsv files
 */
function sanitizeExclude(inputExclude: string){
  if(!inputExclude){
    return 0
  }
  let workingExclude = inputExclude.trim().toLowerCase();
  if (workingExclude.length < 1){
    return 0
  }
  let firstLetter = workingExclude[0];
  if (firstLetter === 'n' || firstLetter === 'f'){
    return 0
  }
  return 1
}

/*
 function that handles any input from the required column in the tsv files
 */
function sanitizeRequired(inputRequired: string){
  if(!inputRequired){
    return 0
  }
  let workingExclude = inputRequired.trim().toLowerCase();
  if (workingExclude.length < 1){
    return 1
  }
  let firstLetter = workingExclude[0];
  if (firstLetter === 'n' || firstLetter === 'f'){
    return 0
  }
  return 1
}

export const parseTsv = (fileContent: string, refCorpus: Corpus, side: AlignmentSide, fileType: CorpusFileFormat) => {
  const [header, ...rows] = fileContent.split('\n');
  const headerMap: Record<string, number> = {};
  if (!refCorpus.wordsByVerse) {
    refCorpus.wordsByVerse = {} as Record<string, Verse>;
  }

  header.split('\t').forEach((header, idx) => {
    header = header === 'identifier' ? 'id' : header; //Standard for header in files will be id
    headerMap[header] = idx;
  });
  const hasGloss = !!(headerMap['english'] ?? headerMap['gloss']);

  rows.forEach((row) => {
    const values = row.split('\t');

    let id, wordKey, wordRef: BCVWP, pos, word: Word, verse, exclude: number, required: number;

    switch (fileType) {
      case CorpusFileFormat.TSV_TARGET:
        const wordText = (values[headerMap['text']] || values[headerMap['lemma']] || '');

        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['id']];
        if (!BCVWP.isValidString(id)) {
          return;
        }
        wordRef = BCVWP.parseFromString(id);
        pos = +id.substring(8, 11); // grab word position
        if (!wordText || wordText.length < 1) return;
        const normalizedText = wordText.toLowerCase();
        exclude = sanitizeExclude(values[headerMap['exclude']]);

        word = {
          id: id, // standardize n40001001002 to  40001001002
          side,
          corpusId: refCorpus.id,
          text: wordText,
          position: pos,
          sourceVerse: values[headerMap['source_verse']] || '',
          normalizedText,
          exclude: exclude,
        };

        wordKey = normalizedText;
        if (refCorpus.wordLocation.has(wordKey)) {
          refCorpus.wordLocation.get(wordKey)?.add(wordRef);
        } else {
          refCorpus.wordLocation.set(wordKey, new Set<BCVWP>([wordRef]));
        }
        verse = refCorpus.wordsByVerse[id.substring(0, 8)] || {};
        refCorpus.wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          sourceVerse: values[headerMap['source_verse']],
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word])
        };
        refCorpus.words.push(word);
        break;

      case CorpusFileFormat.TSV_MACULA:
      default: // grab word position
        // remove redundant 'o'/'n' qualifier
        id = values[headerMap['xml:id']].slice(1);
        pos = +id.substring(8, 11);
        // Gloss is defined at this level since both english and gloss headers can exist.
        // Either could be null within the TSV file.
        const gloss = values[headerMap['english']] || values[headerMap['gloss']] || '-';

        exclude = sanitizeExclude(values[headerMap['exclude']]);
        required = sanitizeRequired(values[headerMap['required']]);

        word = {
          id: id, // standardize n40001001002 to  40001001002
          corpusId: refCorpus.id,
          side,
          text: values[headerMap['text']] || values[headerMap['lemma']] || '',
          after: values[headerMap['after']],
          position: pos,
          gloss: (new RegExp(/^(.+\..+)+$/)).test(gloss)
            ? gloss.replaceAll('.', ' ')
            : gloss,
          exclude: exclude,
          required: required,
        } as Word;

        wordRef = BCVWP.parseFromString(id);
        wordKey = word.text.toLowerCase();
        if (refCorpus.wordLocation.has(wordKey)) {
          refCorpus.wordLocation.get(wordKey)?.add(wordRef);
        } else {
          refCorpus.wordLocation.set(wordKey, new Set<BCVWP>([wordRef]));
        }

        verse = refCorpus.wordsByVerse[id.substring(0, 8)] || {};
        refCorpus.wordsByVerse[id.substring(0, 8)] = {
          ...verse,
          bcvId: BCVWP.parseFromString(id.substring(0, 8)),
          citation: `${+id.substring(2, 5)}:${+id.substring(5, 8)}`,
          words: (verse.words || []).concat([word])
        };
        refCorpus.words.push(word);
        break;
    }
  });

  return {
    ...refCorpus,
    hasGloss
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseTsvByFileType = async (
  tsv: RequestInfo,
  refCorpus: Corpus,
  side: AlignmentSide,
  fileType: CorpusFileFormat
): Promise<Corpus> => {
  const fetchedTsv = await fetch(tsv);
  const response = await fetchedTsv.text();
  return parseTsv(response, refCorpus, side, fileType);
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

export const putVersesInCorpus = (corpus: Corpus) =>
  Object.values(corpus.wordsByVerse).forEach((verse) =>
    putVerseInCorpus(corpus, verse)
  );

const WordQueryBatchSize = 100_000;

export const getCorpusFromDatabase = async (
  inputCorpus: Corpus,
  projectId?: string
): Promise<Corpus|undefined> => {
  if (!projectId) return undefined;
  inputCorpus.wordsByVerse = {} as Record<string, Verse>;
  inputCorpus.words = [];
  let offset = 0;
  while (true) {
    const words = (await dbApi.getAllWordsByCorpus(
      projectId,
      inputCorpus.side,
      inputCorpus.id,
      WordQueryBatchSize, offset));
    if (!words
      || words.length < 1) {
      break;
    }
    for (const word of words) {
      if (!word.text) {
        continue;
      }
      const verseId = (word.id ?? EmptyWordId).substring(0, 8);
      const verseBCV = BCVWP.parseFromString(verseId);
      const verse: Verse = inputCorpus.wordsByVerse[verseId] ?? {};
      inputCorpus.wordsByVerse[verseId] = {
        ...verse,
        sourceVerse: word.sourceVerse ?? verseId,
        bcvId: verseBCV,
        citation: verse.citation ?? `${verseBCV.chapter}:${verseBCV.verse}`,
        words: (verse.words || []).concat([word])
      };
      inputCorpus.words.push(word);
    }
    offset += words.length;
    if (words.length < WordQueryBatchSize) {
      break;
    }
  }
  return inputCorpus;
};

export const getAvailableCorporaContainers = async (appCtx: AppContextProps): Promise<
  Containers
> => {
  if (!appCtx.preferences?.currentProject) {
    return {
      projectId: appCtx.preferences?.currentProject,
      sourceContainer: undefined,
      targetContainer: undefined
    };
  }

  IsLoadingAnyCorpora = true;
  try {
    const inputCorpora: Corpus[] = ((await dbApi.getAllCorpora(appCtx.preferences?.currentProject)) ?? []);
    const corpusPromises: Promise<Corpus|undefined>[] = inputCorpora
      .map((inputCorpus) =>
        getCorpusFromDatabase({
          ...inputCorpus,
          words: [],
          wordsByVerse: {},
          wordLocation: new Map<string, Set<BCVWP>>(),
          books: {},
          hasGloss: inputCorpus.side === AlignmentSide.SOURCE
        }, appCtx.preferences?.currentProject));
    const outputCorpora: Corpus[] =
      (await Promise.all(corpusPromises))
        .filter((c) => !!c)
        .map((c) => c!);
    outputCorpora.forEach(
      outputCorpus => putVersesInCorpus(outputCorpus));

    const sourceContainer = CorpusContainer.fromIdAndCorpora(AlignmentSide.SOURCE,
      outputCorpora.filter(outputCorpus => outputCorpus.side === AlignmentSide.SOURCE));
    const targetContainer = CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET,
      outputCorpora.filter(outputCorpus => outputCorpus.side === AlignmentSide.TARGET));

    return {
      projectId: appCtx.preferences?.currentProject,
      sourceContainer,
      targetContainer
    };
  } finally {
    IsLoadingAnyCorpora = false;
  }
};
