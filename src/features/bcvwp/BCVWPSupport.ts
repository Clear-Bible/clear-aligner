/**
 * This file contains the BCVWP support class that gets instantiated throughout
 * the application
 */
import { BookInfo, findBookByNumber } from '../../workbench/books';

/**
 * BCVWPField references, numbers correspond to length of string at end of those fields
 */
export enum BCVWPField {
  Book = 2,
  Chapter = 5,
  Verse = 8,
  Word = 11,
  Part = 12,
}

export interface BCVWPOverrides {
  book?: number;
  chapter?: number;
  verse?: number;
  word?: number;
  part?: number;
}

/**
 * Zeroed-out BCVWP, for when we need a reference that doesn't link with anything.
 */
export const ZERO_BCVWP = '000000000000';

export default class BCVWP {

  /**
   * 0-based index, from book list here: https://ubsicap.github.io/usfm/identification/books.html
   */
  book?: number;
  /**
   * 1-based index
   */
  chapter?: number;
  /**
   * 1-based index
   */
  verse?: number;
  /**
   * 1-based index
   */
  word?: number;
  /**
   * 1-based index
   */
  part?: number;

  referenceString?: string;

  constructor(
    book?: number,
    chapter?: number,
    verse?: number,
    word?: number,
    part?: number
  ) {
    this.book = book;
    this.chapter = chapter;
    this.verse = verse;
    this.word = word;
    this.part = part;
  }

  toHumanReadableString(): string {
    return `${this.getBookInfo()?.EnglishBookName ?? ''} ${
      this.chapter ?? 'NA'
    }:${this.verse ?? 'NA'} ${this.word ? `w${this.word}` : ''}${
      this.word && this.part ? `/${this.part}` : ''
    }`.trim();
  }

  toTruncatedReferenceString(truncation: BCVWPField): string {
    return this.toReferenceString().substring(0, truncation);
  }

  toReferenceString(): string {
    if (this.referenceString) return this.referenceString;
    const bookFormet = Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
    const chapterFormat = Intl.NumberFormat('en-US', {
      minimumIntegerDigits: 3
    });
    const verseFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
    const wordFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
    this.referenceString = `${this.book ? bookFormet.format(this.book) : '  '}${
      this.chapter ? chapterFormat.format(this.chapter) : '   '
    }${this.verse ? verseFormat.format(this.verse) : '   '}${
      this.word ? wordFormat.format(this.word) : '   '
    }${this.word && this.part ? this.part ?? 1 : ''}`;
    return this.referenceString;
  }

  getBookInfo(): BookInfo | undefined {
    return this.book ? findBookByNumber(this.book) : undefined;
  }

  equals(other: BCVWP): boolean {
    return this.toReferenceString() === other.toReferenceString();
  }

  /**
   * checks whether the given BCVWP match at the given level of truncation
   * @param other BCVWP to check for a match
   * @param truncation amount of truncation to match to
   */
  matchesTruncated(other: BCVWP, truncation: BCVWPField): boolean {
    return (
      this.toTruncatedReferenceString(truncation) ===
      other.toTruncatedReferenceString(truncation)
    );
  }

  clone({ book, chapter, verse, word, part }: BCVWPOverrides): BCVWP {
    return new BCVWP(book ?? this.book,
      chapter ?? this.chapter,
      verse ?? this.verse,
      word ?? this.word,
      part ?? this.part);
  }

  hasFields(...fields: BCVWPField[]) {
    return fields.every((field): boolean => {
      switch (field) {
        case BCVWPField.Book:
          return !!this.book;
        case BCVWPField.Chapter:
          return !!this.chapter;
        case BCVWPField.Verse:
          return !!this.verse;
        case BCVWPField.Word:
          return !!this.word;
        case BCVWPField.Part:
          return !!this.part;
        default:
          return false;
      }
    });
  }

  hasUpToField(field: BCVWPField): boolean {
    const fields = [];
    switch (field) {
      case BCVWPField.Part:
        fields.push(BCVWPField.Part);
      // falls through
      case BCVWPField.Word:
        fields.push(BCVWPField.Word);
      // falls through
      case BCVWPField.Verse:
        fields.push(BCVWPField.Verse);
      // falls through
      case BCVWPField.Chapter:
        fields.push(BCVWPField.Chapter);
      // falls through
      case BCVWPField.Book:
        fields.push(BCVWPField.Book);
        return this.hasFields(...fields);
      default:
        return false;
    }
  }

  static isValidString(reference: string): boolean {
    return (
      !!reference && !!reference.match(/^[onON]?\d/) && reference.length > 1
    );
  }

  static sanitize(wordId: string): string {
    const wordId1 = wordId.trim();
    return !!wordId1.match(/^[onON]\d/)
      ? wordId1.substring(1) : wordId1;
  }

  static truncateTo(reference: string, field: BCVWPField): string {
    return BCVWP.sanitize(reference).substring(0, field);
  }

  static parseFromString(reference: string): BCVWP {
    if (!BCVWP.isValidString(reference)) {
      throw new Error(`Illegal reference string given to parser: ${reference}`);
    }
    const sanitized = BCVWP.sanitize(reference);
    const bookString = sanitized.substring(0, 2);
    const chapterString =
      sanitized.length >= 5 ? sanitized.substring(2, 5) : undefined;
    const verseString =
      sanitized.length >= 8 ? sanitized.substring(5, 8) : undefined;
    const wordString =
      sanitized.length >= 11 ? sanitized.substring(8, 11) : undefined;
    const partString =
      sanitized.length >= 12 ? sanitized.substring(11, 12) : undefined;

    const bookNum = bookString ? Number(bookString) : undefined;
    const chapterNum = chapterString ? Number(chapterString) : undefined;
    const verseNum = verseString ? Number(verseString) : undefined;
    const wordNum = wordString ? Number(wordString) : undefined;
    const partNum = partString ? Number(partString) : undefined;

    return new BCVWP(bookNum, chapterNum, verseNum, wordNum, partNum);
  }

  static compare(a?: BCVWP, b?: BCVWP): number {
    if (a?.book !== b?.book) {
      return (a?.book ?? 0) - (b?.book ?? 0);
    }
    if (a?.chapter !== b?.chapter) {
      return (a?.chapter ?? 0) - (b?.chapter ?? 0);
    }
    if (a?.verse !== b?.verse) {
      return (a?.verse ?? 0) - (b?.verse ?? 0);
    }
    if (a?.word !== b?.word) {
      return (a?.word ?? 0) - (b?.word ?? 0);
    }
    if (a?.part !== b?.part) {
      return (a?.part ?? 0) - (b?.part ?? 0);
    }
    return 0;
  }

  static compareString(a?: string, b?: string): number {
    return BCVWP.compare(BCVWP.parseFromString(a ?? ''), BCVWP.parseFromString(b ?? ''));
  }
}
