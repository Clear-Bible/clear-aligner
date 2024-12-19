export interface ConcordancePivotWord {
  t: string, // normalized text
  l: string, // language id
  c: number  // frequency
}


export interface ConcordanceAlignedWord {
  t: string, // lemma
  sl: string, // sources text language id
  st: string, // sources text
  tl: string, // targets text language id
  tt: string, // targets text
  c: number // frequency
}
