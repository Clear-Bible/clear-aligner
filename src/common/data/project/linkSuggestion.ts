import { AlignmentSide } from './corpus';

/**
 * represents a token suggestion for an alignment
 */
export interface LinkSuggestion {
  /**
   * which side this is a suggestion for
   */
  side: AlignmentSide;
  /**
   * token to be added
   */
  token: string;
}
