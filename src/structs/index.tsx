import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';

export enum SyntaxType {
  // Has syntax data.
  Source = 'source',
  // Mapped to a corpus with syntax data.
  Mapped = 'mapped',
  // Mapped to a corpus that is mapped to a corpus with syntax data.
  MappedSecondary = 'mappedSecondary',
}

export enum CorpusViewType {
  Paragraph = 'paragraph',
  Treedown = 'treedown',
}

export enum TreedownType {
  Source = 'source',
  Mapped = 'mapped',
}

// Linkable sub-unit of corpus
export interface Word {
  id: string;
  corpusId: string;
  side: AlignmentSide;

  text: string;
  // character[s] following the text. i.e. punctuation.
  after?: string;
  position: number;
  gloss?: string;
  normalizedText: string;
  sourceVerse?: string;
}

export interface CorpusViewport {
  containerId: string | null;
}

export interface Verse {
  bcvId: BCVWP;
  sourceVerse?: string;
  citation: string; // ${chapter}:${verse}
  words: Word[];
}

export enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl'
}

/**
 * contains display information about a language
 */
export interface LanguageInfo {
  code: string;
  textDirection: TextDirection;
  fontFamily?: string;
}

// A body of text.
export interface Corpus {
  id: string;
  name: string;
  fullName: string;
  language: LanguageInfo;
  side: string;
  words: Word[];
  wordsByVerse: Record<string, Verse>;
  wordLocation: Map<string, Set<BCVWP>>;
  books: {
    [key: number]: {
      // book object containing chapters
      [key: number]: {
        // chapter object containing verses
        [key: number]: Verse;
      };
    };
  };
  fileName?: string;
  fullText?: string;
  viewType?: CorpusViewType;
  syntax?: SyntaxRoot;
  hasGloss?: boolean;
}

/**
 * Abstracts multiple corpora so they can be addressed as a single unit, typically used for `source` and `target` to
 * hold manuscripts for them
 */
export class CorpusContainer {
  id: string;
  corpora: Corpus[];

  constructor() {
    this.id = '';
    this.corpora = [];
  }

  containsCorpus(corpusId: string): boolean {
    return this.corpora.some((corpus) => corpus.id === corpusId);
  }

  getCorpusById(corpusId: string): Corpus | undefined {
    return this.corpora.find((corpus) => corpus.id === corpusId);
  }

  corpusAtReferenceString(refString: string): Corpus | undefined {
    const verseString = BCVWP.truncateTo(refString, BCVWPField.Verse);
    return this.corpora.find((corpus) => !!corpus.wordsByVerse[verseString]);
  }

  languageAtReferenceString(refString: string): LanguageInfo | undefined {
    return this.corpusAtReferenceString(refString)?.language;
  }

  verseByReference(reference: BCVWP): Verse | undefined {
    if (
      !reference.hasFields(
        BCVWPField.Book,
        BCVWPField.Chapter,
        BCVWPField.Verse
      )
    ) {
      return undefined;
    }
    const corpus = this.corpusAtReferenceString(reference.toReferenceString());
    return corpus?.books[reference.book!]?.[reference.chapter!]?.[
      reference.verse!
      ];
  }

  verseByReferenceString(refString: string): Verse | undefined {
    if (!refString) {
      return undefined;
    }
    return this.verseByReference(BCVWP.parseFromString(refString));
  }

  static fromIdAndCorpora = (
    id: string,
    corpora: Corpus[]
  ): CorpusContainer => {
    const container = new CorpusContainer();
    container.id = id;
    container.corpora = corpora;
    return container;
  };
}

export enum CorpusFileFormat {
  TSV_MACULA,
  TSV_TARGET,
}

export interface BookStats {
  bookNum: number;
  linkCtr: number;
}

export class DatabaseRecord {
  id?: string;
}

export class Project extends DatabaseRecord {
  constructor() {
    super();
    this.bookStats = [];
  }

  bookStats: BookStats[];
}

export class User extends DatabaseRecord {
}

// An instance of alignment
export class Link extends DatabaseRecord {
  constructor() {
    super();
    this.sources = [];
    this.targets = [];
  }

  sources: string[]; // BCVWP identifying the location of the word(s) or word part(s) in the source text(s)
  targets: string[]; // BCVWP identifying the location of the word(s) or word part(s) in the target text(s)
}

export enum AlignmentSide {
  SOURCE = 'sources',
  TARGET = 'targets'
}

export interface AlignmentPolarityBase {
  type: 'primary' | 'secondary';
}

export interface PrimaryAlignmentPolarity extends AlignmentPolarityBase {
  type: 'primary';
  syntaxSide: AlignmentSide;
  nonSyntaxSide: AlignmentSide;
}

export interface SecondaryAlignmentPolarity extends AlignmentPolarityBase {
  type: 'secondary';
  mappedSide: AlignmentSide;
  nonMappedSide: AlignmentSide;
}

export type AlignmentPolarity =
  | PrimaryAlignmentPolarity
  | SecondaryAlignmentPolarity;

export interface Alignment {
  polarity: AlignmentPolarity;
  links: Link[];
}

export interface SyntaxContent {
  elementType: string;
  class?: string;

  n?: string;
  osisId?: string;
  lemma?: string;
  strong?: string;
  gloss?: string;
  text?: string;
  rule?: string;
  role?: string;

  head?: string;
  discontinuous?: string;
  person?: string;
  number?: string;
  gender?: string;
  case?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  articular?: string;
  det?: string;
  type?: string;

  alignedWordIds?: string[];
}

export interface SyntaxNode {
  content: SyntaxContent;
  children: SyntaxNode[];
}

export interface SyntaxRoot extends SyntaxNode {
  _syntaxType: SyntaxType;
}
