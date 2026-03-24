/**
 * This file contains a collection of interfaces to support the
 * ConcordanceView component
 */
import { LanguageInfo, RepositoryLink, Word } from '../../structs';
import { AlignmentSide } from '../../common/data/project/corpus';

/**
 * represents rows displayed in the pivot word table in the concordance view
 */
export interface PivotWord {
  word: string; // normalized text of the pivot word being represented
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
export interface FullyResolvedLink extends RepositoryLink {
  sourceResolvedWords: Set<ResolvedWordEntry>;
  targetResolvedWords: Set<ResolvedWordEntry>;
}
