import {BookInfo, findBookByNumber} from "../workbench/books";

/**
 * BCVWPField references, numbers correspond to length of string at end of those fields
 */
export enum BCVWPField {
  Book = 2,
  Chapter = 5,
  Verse = 8,
  Word = 11,
  Part = 12
}

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

  constructor(book?: number, chapter?: number, verse?: number, word?: number, part?: number) {
    this.book = book;
    this.chapter = chapter;
    this.verse = verse;
    this.word = word;
    this.part = part;
  }

  toTruncatedReferenceString(truncation: BCVWPField): string {
    return this.toReferenceString().substring(0, truncation);
  }

  toReferenceString(): string {
    const bookFormet = Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
    const chapterFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
    const verseFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
    const wordFormat = Intl.NumberFormat('en-US', { minimumIntegerDigits: 3 });
    return `${this.book ? bookFormet.format(this.book) : '  '}${this.chapter ? chapterFormat.format(this.chapter) : '   '}${this.verse ? verseFormat.format(this.verse) : '   '}${this.word ? wordFormat.format(this.word) : '   '}${this.part ?? 1}`;
  }

  getBookInfo(): BookInfo|undefined {
    return this.book ? findBookByNumber(this.book) : undefined;
  }

  /**
   * checks whether the given BCVWP match at the given level of truncation
   * @param other: BCVWP to check for a match
   * @param truncation: amount of truncation to match to
   */
  matchesTruncated(other: BCVWP, truncation: BCVWPField): boolean {
    return this.toTruncatedReferenceString(truncation) === other.toTruncatedReferenceString(truncation);
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
}

export const parseFromString = (reference: string): BCVWP => {
    if (!reference || reference.match(/\D/) || reference.length < 2) {
        throw new Error(`Illegal reference string given to parser: ${reference}`);
    }
    const bookString = reference.substring(0, 2);
    const chapterString = reference.length >= 5 ? reference.substring(2, 5) : undefined;
    const verseString = reference.length >= 8 ? reference.substring(5, 8) : undefined;
    const wordString = reference.length >= 11 ? reference.substring(8, 11) : undefined;
    const partString = reference.length >= 12 ? reference.substring(11, 12) : undefined;

    const bookNum = bookString ? Number(bookString) : undefined;
    const chapterNum = chapterString ? Number(chapterString) : undefined;
    const verseNum = verseString ? Number(verseString) : undefined;
    const wordNum = wordString ? Number(wordString) : undefined;
    const partNum = partString ? Number(partString) : undefined;

    return new BCVWP(bookNum, chapterNum, verseNum, wordNum, partNum);
};
