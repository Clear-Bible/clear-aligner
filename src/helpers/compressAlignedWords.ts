import { RepositoryLink, Word } from '../structs';
import { ZERO_BCVWP } from '../features/bcvwp/BCVWPSupport';

/**
 * Enumeration used to rank compressed words within the output.
 */
export enum WordType {
  NoWord,
  Ellipsis,
  ContextWord,
  AlignedWord
}

/**
 * Compressed word, that may be normal, ellipsis, or aligned.
 */
export interface CompressedWord extends Word {
  wordType: WordType;
}

/**
 * Maximum number of words on either side of an aligned words to retain in the compressed output.
 */
const MaxContextWords = 2;

/**
 * Ellipsis character.
 */
const ELLIPSIS_CHAR = '\u2026';

/**
 * Takes an array of word objects and 1-based indexes (IDs) and produces an array of compressed words
 * that include the following:
 * 1. The aligned words.
 * 2. Two +/- words on either side of (1).
 * 3. An ellipsis beyond that, if there are other words beyond (2) in the supplied word array.
 * 4. And nothing else (e.g., all non-essential input words are excluded).
 *
 * Also:
 * - Context words take priority over ellipses and aligned words take priority over everything else,
 * meaning aligned words <5 words apart will only have context words between them, and aligned words
 * will always appear.
 * - Consecutive ellipses are suppressed, meaning aligned words >4 words apart will have a single
 * ellipsis between them.
 * @param inputWords Array-of-array of input words, each sub-array assumed to be tokens comprising a
 * word (usually 1:1).
 * @param linkMap Map of word IDs to links.
 */
export const compressAlignedWords = (
  inputWords: Word[][],
  linkMap: Map<string, RepositoryLink[]>
): CompressedWord[][] => {
  // compute 0-based indexes, to simplify implementation
  const workInputWords = inputWords.flat();
  const alignedWordIdxs = workInputWords
    .map((inputWord, inputIdx) => linkMap.has(inputWord.id) ? inputIdx : -1)
    .filter(inputIdx => inputIdx >= 0);
  if (alignedWordIdxs.length === 0) {
    return workInputWords.map(inputWord => {
      return {
        ...inputWord,
        wordType: WordType.ContextWord
      } as CompressedWord;
    }).map(outputWord => [outputWord]);
  }
  const maxWordIdx = workInputWords.length - 1;
  // output is a fixed-sized array as large as the input, to simplify implementation
  const workWords: (CompressedWord | undefined)[] = new Array(workInputWords.length).fill(undefined);
  // iterate supplied words
  alignedWordIdxs.forEach(alignedWordIdx => {
    // always place aligned words in output (take priority over everything else)
    workWords[alignedWordIdx] = {
      ...workInputWords[alignedWordIdx],
      wordType: WordType.AlignedWord
    };
    // build context words and ellipses
    for (let ctr = 1; ctr <= MaxContextWords + 1; ctr++) {
      // iterate outward from aligned word index, before and after
      const nextCtrs = [
        Math.min(maxWordIdx, alignedWordIdx + ctr),
        Math.max(0, alignedWordIdx - ctr)
      ];
      nextCtrs.forEach(nextCtr => {
        const outputWord = workWords[nextCtr];
        // figure out if we're placing a context word or are far enough for an ellipsis
        const targetType = ctr <= MaxContextWords
          ? WordType.ContextWord : WordType.Ellipsis;
        // only place words in the output when there's nothing or a lower-priority word type
        // at the given position (e.g., aligned > context, context > ellipsis, aligned > ellipsis)
        if ((outputWord?.wordType ?? WordType.NoWord) < targetType) {
          const inputWord = workInputWords[nextCtr];
          workWords[nextCtr] = {
            ...inputWord,
            wordType: targetType,
            ...(targetType === WordType.Ellipsis ? {
              id: ZERO_BCVWP,
              text: ELLIPSIS_CHAR,
              normalizedText: ELLIPSIS_CHAR,
              after: undefined
            } : {})
          };
        }
      });
    }
  });
  // filter out unused (undefined) output array entries
  const outputWords1 = workWords.filter(Boolean) as CompressedWord[];
  // filter out consecutive ellipses
  const outputWords2 = outputWords1.filter(
    (outputWord, outputIdx) =>
      outputIdx === 0
      || outputWord.wordType !== WordType.Ellipsis
      || outputWords1[outputIdx - 1].wordType !== WordType.Ellipsis);
  // create array-of-arrays of words with integral ellipses
  let tempOutputWords3: CompressedWord[] = [];
  const outputWords3: CompressedWord[][] = [];
  outputWords2.forEach(outputWord => {
    if (tempOutputWords3.length === 0
      || outputWord.wordType === WordType.Ellipsis
      || tempOutputWords3[tempOutputWords3.length - 1].wordType === WordType.Ellipsis) {
      tempOutputWords3.push(outputWord);
    } else {
      outputWords3.push(tempOutputWords3);
      tempOutputWords3 = [outputWord];
    }
  });
  if (tempOutputWords3.length > 0) {
    outputWords3.push(tempOutputWords3);
  }
  return outputWords3;
};
