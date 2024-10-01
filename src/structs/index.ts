/**
 * This file exports the CorpusContainer class which supports multiple corpora
 * and has methods for interacting with said corpora.
 */
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';
import { ServerAlignmentLinkDTO } from '../common/data/serverAlignmentLinkDTO';
import { AlignmentSide } from '../common/data/project/corpus';

/**
 * Parameters common to Project Repository functions
 */
interface ProjectRepositoryBaseParams {
  projectId: string;
  table: string;
}

/**
 * Parameters common to mutating operations in the Project Repository
 */
interface MutatingOperationParams extends ProjectRepositoryBaseParams {
  disableJournaling?: boolean;
}

export interface CreateBulkJournalEntryParams {
  projectId: string;
  links: ServerAlignmentLinkDTO[];
}

/**
 * Parameters for the insert function of the Project Repository
 */
export interface InsertParams<T> extends MutatingOperationParams {
  itemOrItems: T | T[];
  chunkSize?: number;
}

/**
 * Parameters for the save function of the project repository
 */
export interface SaveParams<T> extends MutatingOperationParams {
  itemOrItems: T | T[];
}

/**
 * Parameters for the delete function of the Project Repository
 */
export interface DeleteParams extends MutatingOperationParams {
}

/**
 * Parameters for the deleteById function of the Project Repository
 */
export interface DeleteByIdParams extends MutatingOperationParams {
  itemIdOrIds: string | string[];
}

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
  side: AlignmentSide;
  words: Word[];
  wordsByVerse: Record<string, Verse>;
  wordLocation: Map<string, Set<BCVWP>>;
  createdAt?: Date;
  updatedSinceSync?: number;
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
    const foundCorpus = this.corpora.find((corpus) => !!corpus.wordsByVerse[verseString]);
    if (foundCorpus) return foundCorpus;
    const ref = BCVWP.parseFromString(verseString);
    return this.corpora.find((corpus) => {
      if (ref.book) {
        if (!corpus.books[ref.book]) return false;
        if (ref.chapter) {
          if (!corpus.books[ref.book][ref.chapter]) return false;
          if (ref.verse) {
            const verse: Verse = corpus.books[ref.book][ref.chapter][ref.verse];
            if (!verse) return false;
            if (ref.word && ref.part) {
              if (!verse.words.some((word) => {
                const wordRef = BCVWP.parseFromString(word.id);
                return wordRef.word === ref.word && wordRef.part === ref.part;
              })) return false;
            } else if (ref.word) {
              if (!verse.words.some((word) =>
                BCVWP.parseFromString(word.id).word === ref.word)
              ) return false;
            }
          }
        }
      }
      return true;
    });
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

  wordByReference(reference: BCVWP): Word | undefined {
    if (
      !reference.hasFields(
        BCVWPField.Book,
        BCVWPField.Chapter,
        BCVWPField.Verse,
        BCVWPField.Word
      )
    ) {
      return undefined;
    }
    const corpus = this.corpusAtReferenceString(reference.toReferenceString());
    return corpus?.books[reference.book!]?.[reference.chapter!]?.[
      reference.verse!]?.words?.find(word => word.id === reference.toReferenceString());
  }

  verseByReferenceString(refString: string): Verse | undefined {
    if (!refString) {
      return undefined;
    }
    return this.verseByReference(BCVWP.parseFromString(refString));
  }

  wordByReferenceString(refString: string): Word | undefined {
    if (!refString) {
      return undefined;
    }
    return this.wordByReference(BCVWP.parseFromString(refString));
  }

  refExists(ref: BCVWP): boolean {
    return !!this.corpusAtReferenceString(ref.toReferenceString());
  }

  private mapCorpusBookToRef(book: { [key: number]: { [key: number]: Verse } }): BCVWP {
    const ref = Object.values(book)
      .map((chapter) => Object.values(chapter).find((verse) => !!verse.bcvId))
      .map((verse) => verse?.bcvId.toTruncatedReferenceString(BCVWPField.Book))
      .find((ref) => !!ref)!;
    return BCVWP.parseFromString(ref);
  }

  private mapCorpusChapterToRef(chapter: { [key: number]: Verse }): BCVWP {
    const ref = Object.values(chapter)
      .find((verse) => !!verse.bcvId)!
      .bcvId.toTruncatedReferenceString(BCVWPField.Chapter);
    return BCVWP.parseFromString(ref);
  }

  findNext(ref: BCVWP, truncation: BCVWPField): BCVWP | undefined {
    if (!ref.hasUpToField(truncation) || !this.refExists(ref)) return undefined;
    const corpus = this.corpusAtReferenceString(ref.toReferenceString());
    if (!corpus) return undefined;
    switch (truncation) {
      case BCVWPField.Book:
        // try to find next book in current corpus
        const matchingBooks = Object.values(corpus.books)
          .map(this.mapCorpusBookToRef)
          .filter((bookRef) => bookRef.book! > ref.book!);
        if (matchingBooks.length > 0) return matchingBooks.at(0);
        // otherwise, look at all corpora
        const nextCorpus = this.corpora.find((corpus) => Object.values(corpus.books).some((book) => this.mapCorpusBookToRef(book).book! > ref.book!));
        if (!nextCorpus) return undefined;
        return Object.values(nextCorpus?.books)
          .map(this.mapCorpusBookToRef)
          .sort((a, b) => a.book! - b.book!)
          .at(0);
      case BCVWPField.Chapter:
        // try to find next chapter in current book
        const matchingChapters = Object.values(corpus.books[ref.book!])
          .map(this.mapCorpusChapterToRef)
          .filter((chapterRef) => chapterRef.chapter! > ref.chapter!);
        if (matchingChapters.length > 0) return matchingChapters.at(0);
        // otherwise, grab first available chapter in next book
        const nextBookRef = this.findNext(ref, BCVWPField.Book);
        if (!nextBookRef) return undefined;
        const nextBook = this.corpusAtReferenceString(nextBookRef.toReferenceString())!
          .books[nextBookRef.book!];
        return Object.values(nextBook)
          .map(this.mapCorpusChapterToRef)
          .sort((a, b) => a.chapter! - b.chapter!)
          .at(0);
      case BCVWPField.Verse:
        // try to find next verse in current chapter
        const matchingVerses = Object.values(corpus.books[ref.book!][ref.chapter!])
          .map((verse) => verse.bcvId)
          .filter((verseRef) => verseRef.verse! > ref.verse!);
        if (matchingVerses.length > 0) return matchingVerses.at(0); // first matching
        // otherwise, grab first available verse in next chapter
        const nextChapterRef = this.findNext(ref, BCVWPField.Chapter);
        if (!nextChapterRef) return undefined;
        const nextChapterCorpus = this.corpusAtReferenceString(nextChapterRef.toReferenceString());
        const nextChapter = nextChapterCorpus!
          .books[nextChapterRef.book!][nextChapterRef.chapter!];
        return Object.values(nextChapter)
          .sort((a, b) => a.bcvId.chapter! - b.bcvId.chapter!)
          .map((v) => v.bcvId)
          .at(0);
      case BCVWPField.Word:
        // try to find next word in current verse
        const matchingWords = this.verseByReference(ref)!
          .words
          .map((word) => BCVWP.parseFromString(word.id))
          .filter((wordRef) => wordRef.word! > ref.word!);
        if (matchingWords.length > 0) return matchingWords.at(0); // first matching
        // otherwise, grab first available word in next verse
        const nextVerseRef = this.findNext(ref, BCVWPField.Verse);
        if (!nextVerseRef) return undefined;
        const nextVerse = this.verseByReference(nextVerseRef)!;
        return nextVerse.words
          .map((word) => BCVWP.parseFromString(word.id))
          .filter((wordRef) => wordRef.verse! === nextVerseRef.verse!)
          .at(0);
      case BCVWPField.Part:
        // try to find next part in word
        const matchingWordParts = this.verseByReference(ref)!
          .words
          .map((word) => BCVWP.parseFromString(word.id))
          .filter((wordRef) =>
            wordRef.word === ref.word && wordRef.part! > ref.part!);
        if (matchingWordParts.length > 0) return matchingWordParts.at(0); // first matching
        // otherwise, grab first available part in next word
        const nextWordRef = this.findNext(ref, BCVWPField.Word);
        if (!nextWordRef) return undefined;
        const nextWordVerse = this.verseByReference(nextWordRef)!;
        return nextWordVerse.words
          .map((word) => BCVWP.parseFromString(word.id))
          .filter((wordRef) => wordRef.word === nextWordRef.word)
          .at(0);
      default:
        return undefined;
    }
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

/**
 * The default origin for links created by ClearAligner
 */
export const LinkOriginManual = 'manual';
export type LinkOrigin = 'manual' | string;

/**
 * Enum representing the status of a link
 */
export enum LinkStatus {
  CREATED = 'created',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needsReview',
}

/**
 * Required metadata fields for links go in this interface
 */
export interface LinkMetadata {
  origin: LinkOrigin;
  status: LinkStatus;
}

// An instance of alignment
export class Link extends DatabaseRecord {
  constructor() {
    super();
    this.metadata = {
      origin: 'manual',
      status: LinkStatus.CREATED
    };
    this.sources = [];
    this.targets = [];
  }

  metadata: LinkMetadata;
  sources: string[]; // BCVWP identifying the location of the word(s) or word part(s) in the source text(s)
  targets: string[]; // BCVWP identifying the location of the word(s) or word part(s) in the target text(s)
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

/**
 * Helper class that maintains a matched pair of corpus containers.
 */
export class NamedContainers {
  sources?: CorpusContainer;
  targets?: CorpusContainer;
  all: CorpusContainer[];

  constructor(inputContainers: CorpusContainer[]) {
    this.sources = inputContainers.find(c => c.id === AlignmentSide.SOURCE);
    this.targets = inputContainers.find(c => c.id === AlignmentSide.TARGET);
    this.all = inputContainers;
  }

  /**
   * Returns true if this contains both a source and target container.
   */
  isComplete = (): boolean => !!this.sources && !!this.targets;
}
