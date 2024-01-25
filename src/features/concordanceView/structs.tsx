import { LanguageInfo, Link } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';

/**
 * represents rows displayed in the pivot word table in the concordance view
 */
export interface PivotWord {
  frequency: number; // number of times this pivot word appears in the text
  normalizedText: string; // normalized text of the pivot word being represented
  languageInfo?: LanguageInfo;
  alignedWords?: AlignedWord[];
}

/**
 * text with corresponding language information for display
 */
export interface LocalizedWordEntry {
  text: string;
  position: string;
  languageInfo?: LanguageInfo;
}

/**
 * Represents the data entries in the aligned words table
 */
export interface AlignedWord {
  id: string;
  frequency: number;
  sourceTextId: string;
  targetTextId: string;
  sourceWordTexts: LocalizedWordEntry[];
  targetWordTexts: LocalizedWordEntry[];
  gloss?: string[] | null;
  alignments?: Link[];
}

/**
 * index of alignment Links by normalized pivot word text, an intermediate data structure used by the concordance view
 * for display
 */
export interface NormalizedTextToAlignmentLink {
  [key: string]: Link[];
}

/**
 * index of pivot words by normalized pivot word text, an intermediate data structure used to generate the table data displayed
 * in the concordance view
 */
export interface NormalizedTextToPivotWord {
  [text: string]: PivotWord;
}

/**
 * intermediate data structure used by the concordance view in generating data for tables
 * represents count of occurrences of a word in a text and the language information indexed
 * by word
 */
export interface NormalizedWordsToFrequencyAndLocalization {
  [key: string]: {
    count: number;
    languageInfo: LanguageInfo;
  };
}
