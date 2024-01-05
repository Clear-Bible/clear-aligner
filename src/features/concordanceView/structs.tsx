import { AlignmentSide, LanguageInfo, Link, Word } from '../../structs';

/**
 * represents rows displayed in the pivot word table in the concordance view
 */
export interface PivotWord {
  normalizedText: string; // normalized text of the pivot word being representeda
  side: AlignmentSide;
  frequency: number;
  languageInfo: LanguageInfo;
}

/**
 * text with corresponding language information for display
 */
export interface LocalizedWordEntry {
  text: string; // actual text of the word
  languageInfo?: LanguageInfo;
}

/**
 * Represents the data entries in the aligned words table
 */
export interface AlignedWord {
  id: string;
  frequency: number;
  sourceWordTexts: LocalizedWordEntry;
  targetWordTexts: LocalizedWordEntry;
  gloss?: string[] | null;
}

/**
 * ties together the Word from the corpus and all display information so as not to require lookups for display
 */
export interface ResolvedWordEntry {
  word: Word;
  localized: LocalizedWordEntry;
}

/**
 * a Link hydrated with enough information that no additional lookups should be required to display or otherwise work
 * with this Link in the code
 */
export interface FullyResolvedLink extends Link {
  sourceResolvedWords: Set<ResolvedWordEntry>;
  targetResolvedWords: Set<ResolvedWordEntry>;
}
