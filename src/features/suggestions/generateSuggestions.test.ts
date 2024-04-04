// import { Word, Link, Verse, AlignmentSide } from 'structs';
import getTestData from './generateSuggestions.data';
import generateSuggestions from './generateSuggestions';

describe('Alignment Suggestions', () => {
  describe('MATT 1:1, SBLGNT => YLT', () => {
    const testData = getTestData('Matt 1:2');

    it('returns undefined when there is no link history (selected source)', () => {
      const result = generateSuggestions(
        testData.source.words[0],
        testData.source.words,
        testData.target.words,
        [],
        []
      );

      expect(result).toEqual(undefined);
    });

    it('returns undefined when there is no link history (selected target)', () => {
      const result = generateSuggestions(
        testData.target.words[0],
        testData.source.words,
        testData.target.words,
        [],
        []
      );

      expect(result).toEqual(undefined);
    });
    it('correctly handles first word with simple history (selected source)', () => {
      const result = generateSuggestions(
        testData.source.words[0],
        testData.source.words,
        testData.target.words,
        [{ sourceWords: ['Ἀβραὰμ'], targetWords: ['Abraham'], frequency: 1 }],
        []
      );

      expect(result).toEqual([testData.target.words[0]]);
    });
    it('correctly handles first word with simple history (selected target)', () => {
      const result = generateSuggestions(
        testData.target.words[0],
        testData.source.words,
        testData.target.words,
        [{ sourceWords: ['Ἀβραὰμ'], targetWords: ['Abraham'], frequency: 1 }],
        []
      );

      expect(result).toEqual([testData.source.words[0]]);
    });
    it('correctly handles first unlinked word with simple history (selected source)', () => {
      const result = generateSuggestions(
        testData.source.words[6],
        testData.source.words,
        testData.target.words,
        [{ sourceWords: ['ἐγέννησεν'], targetWords: ['begat'], frequency: 5 }],
        [{ sources: ['40001002002'], targets: ['40001002002'] }]
      );

      expect(result).toEqual([testData.target.words[5]]);
    });

    it('correctly handles first unlinked word with simple history (selected target)', () => {
      const result = generateSuggestions(
        testData.target.words[5],
        testData.source.words,
        testData.target.words,
        [{ sourceWords: ['ἐγέννησεν'], targetWords: ['begat'], frequency: 5 }],
        [{ sources: ['40001002002'], targets: ['40001002002'] }]
      );

      expect(result).toEqual([testData.source.words[6]]);
    });
  });
});
