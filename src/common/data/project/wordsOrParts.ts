import { Word } from '../../../structs';
import { AlignmentSide } from './corpus';

export interface WordOrPartDTO {
  id: string;
  side: AlignmentSide;
  corpusId: string;
  text: string;
  lemma: string;
  after?: string;
  gloss?: string;
  sourceVerseBcv?: string;
  exclude?: number;
  required?: number;
}

export const mapWordOrPartToWordOrPartDTO = (wordOrPart: Word): WordOrPartDTO => ({
  id: wordOrPart.id,
  side: wordOrPart.side,
  corpusId: wordOrPart.corpusId,
  text: wordOrPart.text,
  after: wordOrPart.after,
  gloss: wordOrPart.gloss,
  sourceVerseBcv: wordOrPart.sourceVerse,
  exclude: wordOrPart.exclude,
  required: wordOrPart.required,
  lemma: wordOrPart.lemma
});

export const mapWordOrPartDtoToWordOrPart = (wordOrPart: WordOrPartDTO): Word => ({
  id: wordOrPart.id,
  side: wordOrPart.side as unknown as AlignmentSide,
  corpusId: wordOrPart.corpusId,
  text: wordOrPart.text,
  after: wordOrPart.after,
  gloss: wordOrPart.gloss,
  sourceVerse: wordOrPart.sourceVerseBcv,
  position: 0,
  normalizedText: wordOrPart.text?.toLowerCase() ?? '',
  lemma: wordOrPart.lemma?.toLowerCase() ?? '',
  exclude: wordOrPart.exclude,
  required: wordOrPart.required
});
