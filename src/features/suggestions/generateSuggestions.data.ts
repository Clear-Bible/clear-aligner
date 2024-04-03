import { Word, Link, Verse, AlignmentSide } from 'structs';
import BCVWP from '../bcvwp/BCVWPSupport';

export default function getTestData(ref: string): {
  source: Verse;
  target: Verse;
} {
  return {
    source: sources[ref],
    target: targets[ref],
  };
}

const sources: Record<string, Verse> = {
  'Matt 1:2': {
    bcvId: new BCVWP(40, 1, 2),
    citation: '',
    words: [
      {
        id: '40001002001',
        corpusId: 'sblgnt',
        side: AlignmentSide.SOURCE,
        text: 'Ἀβραὰμ',
        after: '',
        position: 0,
        normalizedText: '',
      },
      {
        id: '40001002002',
        corpusId: 'sblgnt',
        side: AlignmentSide.SOURCE,
        text: 'ἐγέννησεν',
        after: '',
        position: 1,
        normalizedText: '',
      },
      {
        id: '40001002003',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'τὸν',
        after: '',
        position: 2,
        normalizedText: '',
      },
      {
        id: '40001002004',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'Ἰσαάκ',
        after: '',
        position: 3,
        normalizedText: '',
      },
      {
        id: '40001002005',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'Ἰσαὰκ',
        after: '',
        position: 4,
        normalizedText: '',
      },
      {
        id: '40001002006',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'δὲ',
        after: '',
        position: 5,
        normalizedText: '',
      },
      {
        id: '40001002007',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'ἐγέννησεν',
        after: '',
        position: 6,
        normalizedText: '',
      },
      {
        id: '40001002008',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'τὸν',
        after: '',
        position: 7,
        normalizedText: '',
      },
      {
        id: '40001002009',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'Ἰακώβ',
        after: '',
        position: 8,
        normalizedText: '',
      },
      {
        id: '40001002010',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'Ἰακώβ',
        after: '',
        position: 9,
        normalizedText: '',
      },
      {
        id: '40001002011',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'Ἰακὼβ',
        after: '',
        position: 10,
        normalizedText: '',
      },
      {
        id: '40001002012',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'δὲ',
        after: '',
        position: 11,
        normalizedText: '',
      },
      {
        id: '40001002013',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'ἐγέννησεν',
        after: '',
        position: 12,
        normalizedText: '',
      },
      {
        id: '40001002014',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'τὸν',
        after: '',
        position: 13,
        normalizedText: '',
      },
      {
        id: '40001002015',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'Ἰούδαν',
        after: '',
        position: 14,
        normalizedText: '',
      },
      {
        id: '40001002016',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'καὶ',
        after: '',
        position: 15,
        normalizedText: '',
      },
      {
        id: '40001002017',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'τοὺς',
        after: '',
        position: 16,
        normalizedText: '',
      },
      {
        id: '40001002018',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'ἀδελφοὺς',
        after: '',
        position: 17,
        normalizedText: '',
      },
      {
        id: '40001002019',
        corpusId: '',
        side: AlignmentSide.SOURCE,
        text: 'αὐτοῦ',
        after: '',
        position: 18,
        normalizedText: '',
      },
    ],
  },
};

// Ἀβραὰμ
// ἐγέννησεν
// τὸν
// Ἰσαάκ,
// Ἰσαὰκ
// δὲ
// ἐγέννησεν
// τὸν
// Ἰακώβ,
// Ἰακὼβ
// δὲ
// ἐγέννησεν
// τὸν
// Ἰούδαν
// καὶ
// τοὺς
// ἀδελφοὺς
// αὐτοῦ,
const sourceWords: Word[] = [];

// Abraham
// begat
// Isaac
// and
// Isaac
// begat
// Jacob
// and
// Jacob
// begat
// Judah
// and
// his
// brethren
const targetWords: Word[] = [
  {
    id: '40001002001',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'Abraham',
    after: '',
    position: 0,
    normalizedText: '',
  },
  {
    id: '40001002002',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'begat',
    after: '',
    position: 1,
    normalizedText: '',
  },
  {
    id: '40001002003',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'Isaac',
    after: '',
    position: 2,
    normalizedText: '',
  },
  {
    id: '40001002004',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'and',
    after: '',
    position: 3,
    normalizedText: '',
  },
  {
    id: '40001002005',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'Isaac',
    after: '',
    position: 4,
    normalizedText: '',
  },
  {
    id: '40001002006',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'begat',
    after: '',
    position: 5,
    normalizedText: '',
  },
  {
    id: '40001002007',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'Jacob',
    after: '',
    position: 6,
    normalizedText: '',
  },
  {
    id: '40001002008',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'and',
    after: '',
    position: 7,
    normalizedText: '',
  },
  {
    id: '40001002009',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'Jacob',
    after: '',
    position: 8,
    normalizedText: '',
  },
  {
    id: '40001002010',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'begat',
    after: '',
    position: 9,
    normalizedText: '',
  },
  {
    id: '40001002011',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'Judah',
    after: '',
    position: 10,
    normalizedText: '',
  },
  {
    id: '40001002012',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'and',
    after: '',
    position: 11,
    normalizedText: '',
  },
  {
    id: '40001002013',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'his',
    after: '',
    position: 12,
    normalizedText: '',
  },
  {
    id: '40001002014',
    corpusId: 'ylt',
    side: AlignmentSide.TARGET,
    text: 'brethren',
    after: '',
    position: 13,
    normalizedText: '',
  },
];

const targets: Record<string, Verse> = {
  'Matt 1:2': {
    bcvId: new BCVWP(40, 1, 2),
    citation: '',
    words: [
      {
        id: '40001002001',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'Abraham',
        after: '',
        position: 0,
        normalizedText: '',
      },
      {
        id: '40001002002',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'begat',
        after: '',
        position: 1,
        normalizedText: '',
      },
      {
        id: '40001002003',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'Isaac',
        after: '',
        position: 2,
        normalizedText: '',
      },
      {
        id: '40001002004',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'and',
        after: '',
        position: 3,
        normalizedText: '',
      },
      {
        id: '40001002005',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'Isaac',
        after: '',
        position: 4,
        normalizedText: '',
      },
      {
        id: '40001002006',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'begat',
        after: '',
        position: 5,
        normalizedText: '',
      },
      {
        id: '40001002007',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'Jacob',
        after: '',
        position: 6,
        normalizedText: '',
      },
      {
        id: '40001002008',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'and',
        after: '',
        position: 7,
        normalizedText: '',
      },
      {
        id: '40001002009',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'Jacob',
        after: '',
        position: 8,
        normalizedText: '',
      },
      {
        id: '40001002010',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'begat',
        after: '',
        position: 9,
        normalizedText: '',
      },
      {
        id: '40001002011',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'Judah',
        after: '',
        position: 10,
        normalizedText: '',
      },
      {
        id: '40001002012',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'and',
        after: '',
        position: 11,
        normalizedText: '',
      },
      {
        id: '40001002013',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'his',
        after: '',
        position: 12,
        normalizedText: '',
      },
      {
        id: '40001002014',
        corpusId: 'ylt',
        side: AlignmentSide.TARGET,
        text: 'brethren',
        after: '',
        position: 13,
        normalizedText: '',
      },
    ],
  },
};
