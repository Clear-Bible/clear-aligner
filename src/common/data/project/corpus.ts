import { LanguageDTO } from './language';
import { WordOrPartDTO } from './wordsOrParts';
import { TextDirection } from '../../../structs';

export const CORPORA_TABLE_NAME: string = 'corpora';

export enum AlignmentSide {
  SOURCE = 'sources',
  TARGET = 'targets'
}

export interface CorpusDTO {
  id: string; // uuid
  name: string;
  side: AlignmentSide;
  fullName: string;
  fileName: string;
  language: LanguageDTO;
  languageCode: string;
  words?: WordOrPartDTO[];
}

/**
 * CorporaEntity class is used to define projects.
 * Both source and target corpora are used to define alignment data
 * If this.side === 'target', then it's used to define a project.
 */
export class CorpusEntity {
  id?: string;
  language_id?: string;
  side: AlignmentSide;
  name?: string;
  full_name?: string;
  file_name?: string;
  words?: string;
  createdAt?: Date;
  updatedAt?: Date;
  updated_since_sync?: number;

  constructor() {
    this.id = undefined;
    this.language_id = undefined;
    this.side = AlignmentSide.TARGET;
    this.name = '';
    this.full_name = '';
    this.file_name = '';
    this.words = undefined;
  }
}

/**
 * extended class used for some database queries
 */
export class CorpusEntityWithLanguage extends CorpusEntity {
  code: string;
  textDirection: TextDirection;
  fontFamily?: string;

  constructor() {
    super();
    this.code = '';
    this.textDirection = TextDirection.LTR;
  }
}
