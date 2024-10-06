import { AlignmentSide } from './corpus';

/**
 * represents a token suggestion for an alignment which has not yet been resolved
 * to a specific token id ({@link BCVWP})
 */
export interface ProtoLinkSuggestion {
  /**
   * which side this is a suggestion for
   */
  side: AlignmentSide;
  /**
   * normalized token text being suggested
   */
  normalizedTokenText: string;
}

/**
 * represents a suggestion for a link which has been fully resolved to a specific BCV
 */
export interface ResolvedLinkSuggestion {
  /**
   * which side this is a suggestion for
   */
  side: AlignmentSide;
  /**
   * resolved reference of token
   */
  tokenRef: string;
}
