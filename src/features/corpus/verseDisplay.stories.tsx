import { Meta } from '@storybook/react';
import { VerseDisplay, VerseDisplayProps } from './verseDisplay';
import { Corpus, TextDirection, Verse } from '../../structs';
import BCVWP from '../bcvwp/BCVWPSupport';

const meta: Meta<typeof VerseDisplay> = {
  title: 'VerseDisplay',
  component: VerseDisplay,
};

export default meta;

const mockVerse: Verse = {
  bcvId: BCVWP.parseFromString('45005003'),
  citation: '5:3',
  words: [
    {
      id: '45005003001',
      corpusId: 'na27-YLT',
      side: 'targets',
      text: 'And',
      position: 1,
      normalizedText: 'and'
    },
    {
      id: '45005003002',
      corpusId: 'na27-YLT',
      side: 'targets',
      text: 'not',
      position: 2,
      normalizedText: 'not'
    },
    {
      id: '45005003003',
      corpusId: 'na27-YLT',
      side: 'targets',
      text: 'only',
      position: 3,
      normalizedText: 'only'
    },
    {
      id: '45005003004',
      corpusId: 'na27-YLT',
      side: 'targets',
      text: 'so',
      position: 4,
      normalizedText: 'so'
    },
  ],
};

export const Default = (props: VerseDisplayProps) => (
  <VerseDisplay {...props} />
);

Default.args = {
  verse: mockVerse,
} as VerseDisplayProps;

export const Disabled = (props: VerseDisplayProps) => (
  <VerseDisplay {...props} />
);
Disabled.args = {
  readonly: true,
  verse: mockVerse,
} as VerseDisplayProps;

export const RTLVerse = (props: VerseDisplayProps) => {
  return <VerseDisplay {...props} />;
};

const mockRtlWords = [
  {
    id: '450050030011',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'وَلَيْسَ',
    position: 1,
  },
  {
    id: '450050030021',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'ذَلِكَ',
    position: 2,
  },
  {
    id: '450050030031',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'فَقَطْ،',
    position: 3,
  },
  {
    id: '450050030041',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'بَلْ',
    position: 4,
  },
  {
    id: '450050030051',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'نَفْتَخِرُ',
    position: 5,
  },
  {
    id: '450050030061',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'أَيْضًا',
    position: 6,
  },
  {
    id: '450050030071',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'فِي',
    position: 7,
  },
  {
    id: '450050030081',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'ٱلضِّيقَاتِ،',
    position: 8,
  },
  {
    id: '450050030091',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'عَالِمِينَ',
    position: 9,
  },
  {
    id: '450050030101',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'أَنَّ',
    position: 10,
  },
  {
    id: '450050030111',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'ٱلضِّيقَ',
    position: 11,
  },
  {
    id: '450050030121',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'يُنْشِئُ',
    position: 12,
  },
  {
    id: '450050030131',
    corpusId: 'na27-YLT',
    side: 'targets',
    text: 'صَبْرًا،',
    position: 13,
  },
];

RTLVerse.args = {
  readonly: true,
  verse: {
    bcvId: BCVWP.parseFromString('45005003'),
    citation: '5:3',
    words: mockRtlWords,
  },
  corpus: {
    languageInfo: {
      code: 'arb',
      textDirection: TextDirection.RTL,
    },
    hasGloss: false,
    words: mockRtlWords
  } as unknown as Corpus,
} as VerseDisplayProps;

export const Hebrew = (props: VerseDisplayProps) => <VerseDisplay {...props} />;

const mockHebrewWords = [
  {
    id: '010010010011',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'בְּ',
    after: '',
    position: 1,
  },
  {
    id: '010010010012',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'רֵאשִׁ֖ית',
    after: ' ',
    position: 1,
  },
  {
    id: '010010010021',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'בָּרָ֣א',
    after: ' ',
    position: 2,
  },
  {
    id: '010010010031',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'אֱלֹהִ֑ים',
    after: ' ',
    position: 3,
  },
  {
    id: '010010010041',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'אֵ֥ת',
    after: ' ',
    position: 4,
  },
  {
    id: '010010010051',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'הַ',
    after: '',
    position: 5,
  },
  {
    id: '010010010052',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'שָּׁמַ֖יִם',
    after: ' ',
    position: 5,
  },
  {
    id: '010010010061',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'וְ',
    after: '',
    position: 6,
  },
  {
    id: '010010010062',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'אֵ֥ת',
    after: ' ',
    position: 6,
  },
  {
    id: '010010010071',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'הָ',
    after: '',
    position: 7,
  },
  {
    id: '010010010072',
    corpusId: 'wlc-hebot',
    side: 'sources',
    text: 'אָֽרֶץ',
    after: '׃',
    position: 7,
  },
];

Hebrew.args = {
  verse: {
    bcvId: {
      book: 1,
      chapter: 1,
      verse: 1,
    },
    citation: '1:1',
    words: mockHebrewWords,
  },
  corpus: {
    languageInfo: {
      code: 'heb',
      textDirection: TextDirection.RTL,
      fontFamily: 'sbl-hebrew',
    },
    hasGloss: false,
    words: mockHebrewWords
  } as unknown as Corpus,
} as VerseDisplayProps;
