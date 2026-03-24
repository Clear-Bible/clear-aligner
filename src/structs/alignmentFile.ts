import { LinkMetadata } from './index';

/**
 * Metadata saved in alignment json files
 */
export interface RecordMetadata extends LinkMetadata {
  id: string;
}

/**
 * Alignment link for reading from/writing to alignment json files
 */
export interface AlignmentRecord {
  meta: RecordMetadata;
  source: string[];
  target: string[];
}

/**
 * The model representation of the Alignment data file.
 */
export interface AlignmentFile {
  type: string;
  meta: {
    creator: string;
  };
  records: AlignmentRecord[];
}
