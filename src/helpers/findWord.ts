import { Corpus, Word } from 'structs';
import BCVWP, { BCVWPField } from '../features/bcvwp/BCVWPSupport';

export const findWordById = (corpora: Corpus[], word: BCVWP) =>
  findWordByString(corpora, word.toReferenceString());

export const findWordByString = (corpora: Corpus[], word: string) => {
  for (const corpus of corpora) {
    const found = (
      corpus.wordsByVerse[BCVWP.truncateTo(word, BCVWPField.Verse)]?.words || []
    ).find(
      (w: Word) =>
        BCVWP.truncateTo(word, BCVWPField.Part) ===
        BCVWP.truncateTo(w.id, BCVWPField.Part)
    );

    if (Boolean(found)) {
      return found;
    }
  }
  return undefined;
};

export default findWordById;
