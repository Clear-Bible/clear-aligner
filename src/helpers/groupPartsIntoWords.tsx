import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';
import { Word } from '../structs';
import { LocalizedWordEntry } from '../features/concordanceView/structs';

type IdLookupFunction<T> = (t: T) => string;

const groupingReducer = <T extends Word | LocalizedWordEntry>(
  accumulator: T[][],
  currentValue: T,
  idLookup: IdLookupFunction<T>
): T[][] => {
  const lastIndex = accumulator.length - 1;
  const currentValueRef: BCVWP = BCVWP.parseFromString(idLookup(currentValue));

  if (
    accumulator[lastIndex]?.length === 0 ||
    (lastIndex >= 0 &&
      BCVWP.parseFromString(
        idLookup(accumulator[lastIndex].at(-1)!)
      ).matchesTruncated(currentValueRef, BCVWPField.Word))
  ) {
    // if text should be grouped in the last word
    accumulator[lastIndex].push(currentValue);
    return accumulator;
  } else {
    // new word
    accumulator.push([currentValue]);
    return accumulator;
  }
};

/**
 * Words as a type represent entire words as well as word parts and this function takes a list of Words in and returns
 * a two-dimensional array in which the top level contains words and each of those arrays contains the parts of those
 * words
 * @param words list of words and/or word-part inputs
 * @returns two-dimensional array of word parts grouped by word
 */
export const groupPartsIntoWords = <T extends Word>(words: T[]): T[][] =>
  words
    .reduce(
      (accumulator, currentValue) =>
        groupingReducer(accumulator, currentValue, (part: T) => part.id),
      [] as T[][]
    )
    .filter((value) => value.length >= 1);

export const groupLocalizedPartsByWord = (
  words: LocalizedWordEntry[]
): LocalizedWordEntry[][] =>
  words
    .reduce(
      (accumulator, currentValue) =>
        groupingReducer(
          accumulator,
          currentValue,
          (part: LocalizedWordEntry) => part.position
        ),
      [] as LocalizedWordEntry[][]
    )
    .filter((value) => value.length >= 1);
