import { Word, Alignment, PrimaryAlignmentPolarity } from 'structs';

import alignmentSliceReducer, {
  toggleTextSegment,
  initialState,
} from 'state/alignment.slice';
import { AlignmentMode } from './alignmentState';

const englishAlignment: Alignment = {
  links: [],
  polarity: {
    type: 'primary',
    syntaxSide: 'sources',
    nonSyntaxSide: 'targets',
  },
};
const spanishAlignment: Alignment = {
  links: [],
  polarity: {
    type: 'primary',
    syntaxSide: 'sources',
    nonSyntaxSide: 'targets',
  },
};

const sourceWord1: Word = {
  id: 'sbl_0',
  corpusId: 'sbl',
  side: 'sources',
  text: '',
  position: 0,
};

const targetWord1: Word = {
  id: 'leb_1',
  corpusId: 'leb',
  side: 'targets',
  text: '',
  position: 1,
};
const targetWord2: Word = {
  id: 'leb_2',
  corpusId: 'leb',
  side: 'targets',
  text: '',
  position: 2,
};

describe('alignmentSlice reducer', () => {
  describe('toggleTextSegment', () => {
    it('selects a single unselected segment', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: null,
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord1,
        })
      );

      expect(resultState.inProgressLink).toEqual({
        id: 'sbl-leb-0',
        source: 'sbl',
        target: 'leb',
        sources: [],
        targets: ['leb_1'],
      });
    });

    it('deselects a single selected segment', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: [],
          targets: ['leb_1'],
        },
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord1,
        })
      );

      // When the last selected segment has been untoggled,
      // for now the desired behavior is to go back to clean slate.
      expect(resultState.inProgressLink).toBeNull();
    });

    it('deselects a single selected segment (others remaining)', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1', 'leb_2'],
        },
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord1,
        })
      );

      expect(resultState.inProgressLink).toEqual({
        id: 'sbl-leb-0',
        source: 'sbl',
        target: 'leb',
        sources: ['sbl_0'],
        targets: ['leb_2'],
      });
    });

    it('deselects a single selected segment (only source remains)', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1'],
        },
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord1,
        })
      );

      expect(resultState.inProgressLink).toEqual({
        id: 'sbl-leb-0',
        source: 'sbl',
        target: 'leb',
        sources: ['sbl_0'],
        targets: [],
      });
    });

    it('deselects a single selected segment (only target remains)', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1'],
        },
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: sourceWord1,
        })
      );

      expect(resultState.inProgressLink).toEqual({
        id: 'sbl-leb-0',
        source: 'sbl',
        target: 'leb',
        sources: [],
        targets: ['leb_1'],
      });
    });
    it('selects a target segment (only source previously)', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: [],
        },
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord1,
        })
      );

      expect(resultState.inProgressLink).toEqual({
        id: 'sbl-leb-0',
        source: 'sbl',
        target: 'leb',
        sources: ['sbl_0'],
        targets: ['leb_1'],
      });
    });

    it('selects a source segment (only target previously)', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: [],
          targets: ['leb_1'],
        },
      };
      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: sourceWord1,
        })
      );

      expect(resultState.inProgressLink).toEqual({
        id: 'sbl-leb-0',
        source: 'sbl',
        target: 'leb',
        sources: ['sbl_0'],
        targets: ['leb_1'],
      });
    });

    it('enters select mode (from blank slate)', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              { id: 'sbl-leb-1', sources: ['sbl_0'], targets: ['leb_1'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: null,
      };

      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord1,
        })
      );
    });

    it('enters edit mode (from select)', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              { id: 'sbl-leb-1', sources: ['sbl_0'], targets: ['leb_1'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: {
          id: 'sbl-leb-1',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1'],
        },
      };

      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: targetWord2,
        })
      );
    });

    it('enters edit mode (from clean) for non-ambigious alignments', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'nvi',
            links: [
              { id: 'sbl-nvi-1', sources: ['sbl_0'], targets: ['nvi_1'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
          {
            source: 'nvi',
            target: 'leb',
            links: [
              { id: 'nvi-leb-1', sources: ['nvi_1'], targets: ['leb_3'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: null,
      };

      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: {
            id: 'leb_4',
            corpusId: 'leb',
            side: 'targets',
            text: 'some word',
            position: 4,
          },
        })
      );

      expect(resultState.inProgressLink).toBeTruthy();
      expect(resultState.inProgressLink?.id).toEqual('nvi-leb-2');
    });

    it('enters partial edit mode (from clean, ambiguous)', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'nvi',
            links: [
              { id: 'sbl-nvi-1', sources: ['sbl_0'], targets: ['nvi_1'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
          {
            source: 'nvi',
            target: 'leb',
            links: [
              { id: 'nvi-leb-1', sources: ['nvi_1'], targets: ['leb_3'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: null,
      };

      try {
        alignmentSliceReducer(
          previousState,
          toggleTextSegment({
            foundRelatedLinks: [],
            word: {
              id: 'nvi_6',
              corpusId: 'nvi',
              side: 'sources',
              text: 'some word',
              position: 6,
            },
          })
        );
      } catch (error) {
        if (error instanceof Error) {
          expect(error.message).toEqual(
            'DISAMBIGUATE POTENTIAL ALIGNMENTS? Not implemented yet.'
          );
        }
      }

      // expect(resultState.inProgressLink).toBeTruthy();
      // expect(resultState.inProgressLink?._id).toEqual('?');
      // expect(resultState.mode).toEqual(AlignmentMode.PartialEdit);
    });

    it('enters edit mode (from partial edit)', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'nvi',
            target: 'sbl',
            links: [
              { id: 'nvi-sbl-1', sources: ['nvi_0'], targets: ['sbl_1'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
      };

      const resultState = alignmentSliceReducer(
        previousState,
        toggleTextSegment({
          foundRelatedLinks: [],
          word: {
            id: 'sbl_2',
            corpusId: 'sbl',
            side: 'targets',
            // role: CorpusRole.Target,
            text: 'asdf',
            position: 3,
          },
        })
      );

      expect(resultState.inProgressLink?.id).toEqual('nvi-sbl-2');
    });
  });

  describe('createLink', () => {
    it('adds first link based on selected text segments (sbl => leb)', () => {
      const previousState = {
        ...initialState,
        alignments: [englishAlignment],
        inProgressLink: {
          id: 'sbl-leb-0',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_1'],
          targets: ['leb_1'],
        },
        //[sourceWord2, targetWord1],
      };
    });

    it('adds first link based on selected text segments (sbl => nvi)', () => {
      const previousState = {
        ...initialState,
        alignments: [spanishAlignment],
        inProgressLink: {
          id: 'sbl-nvi-1',
          source: 'sbl',
          target: 'nvi',
          sources: ['sbl_1'],
          targets: ['nvi_1'],
        },
      };
    });

    it('adds a segment to an existing link', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              { id: 'sbl-leb-1', sources: ['sbl_0'], targets: ['leb_1'] },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: {
          id: 'sbl-leb-1',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1', 'leb_2'],
        },
      };
    });

    it('removes a segment to an existing link', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              {
                id: 'sbl-leb-1',
                sources: ['sbl_0'],
                targets: ['leb_1', 'leb_2'],
              },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: {
          id: 'sbl-leb-1',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1'],
        },
      };
    });
  });

  describe('deleteLink', () => {
    it('does nothing when there is no inProgressLink', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              {
                id: 'sbl-leb-1',
                sources: ['sbl_0'],
                targets: ['leb_1', 'leb_2'],
              },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
      };
    });

    it('deletes a matching link', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              {
                id: 'sbl-leb-1',
                sources: ['sbl_0'],
                targets: ['leb_1', 'leb_2'],
              },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: {
          id: 'sbl-leb-1',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1'],
        },
      };
    });

    it('deletes a link that only matches ID', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              {
                id: 'sbl-leb-1',
                sources: ['sbl_0'],
                targets: ['leb_1'],
              },

              {
                id: 'sbl-leb-2',
                sources: ['sbl_3'],
                targets: ['leb_1', 'leb_2'],
              },

              {
                id: 'sbl-leb-8',
                sources: ['sbl_7'],
                targets: ['leb_3', 'leb_8'],
              },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],

        inProgressLink: {
          id: 'sbl-leb-1',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_0'],
          targets: ['leb_1'],
        },
      };
    });

    it('deletes the correct link out of several', () => {
      const previousState = {
        ...initialState,
        alignments: [
          {
            source: 'sbl',
            target: 'leb',
            links: [
              {
                id: 'sbl-leb-1',
                sources: ['sbl_0'],
                targets: ['leb_1', 'leb_2'],
              },
            ],
            polarity: {
              type: 'primary',
              syntaxSide: 'sources',
              nonSyntaxSide: 'targets',
            } as PrimaryAlignmentPolarity,
          },
        ],
        inProgressLink: {
          id: 'sbl-leb-1',
          source: 'sbl',
          target: 'leb',
          sources: ['sbl_30'],
          targets: ['leb_5'],
        },
      };
    });
  });
});
