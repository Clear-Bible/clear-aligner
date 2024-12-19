/**
 * Interface used to define pivot word objects displayed on the concordance view.
 * Contains text, language, and frequency data, based on the TSV tokens.
 */
export interface ConcordancePivotWord {
  t: string, // normalized text
  l: string, // language id
  c: number  // frequency
}


/**
 * Interface used to define aligned word objects displayed on the concordance view.
 * Contains lemma, source text/language, target text/language and frequency data, based on the TSV tokens.
 */
export interface ConcordanceAlignedWord {
  t: string, // lemma
  sl: string, // sources text language id
  st: string, // sources text
  tl: string, // targets text language id
  tt: string, // targets text
  c: number // frequency
}
