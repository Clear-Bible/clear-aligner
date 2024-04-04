/*
 * Implements a recoomendation algorithm outlined by Steve Runge.
 *
 * Whenever a source or target token is clicked,
 * the existing aligment history is filtered on that selection.
 * The results are sorted by frequency.
 *
 * Potential suggestions are then projected onto the first
 * unlinked instance found on the opposite side.
 *
 * This iteration focuses on single word suggestions.
 */

import { Word, Verse, Link, AlignmentSide } from 'structs';

// Models a denormalized alignment history.
interface SurfaceLink {
  sourceWords: string[];
  targetWords: string[];
  frequency: number;
}

function linkExistsForWord(
  id: string,
  existingLinks: Link[],
  side: AlignmentSide
): boolean {
  for (const existingLink of existingLinks) {
    if (side === AlignmentSide.SOURCE) {
      if (existingLink.sources.includes(id)) {
        return true;
      }
    }

    if (side === AlignmentSide.TARGET) {
      if (existingLink.targets.includes(id)) {
        return true;
      }
    }
  }
  return false;
}

export default function generateSuggestions(
  selectedWord: Word, // The selected word
  sourceVerse: Word[], // The words in the source context
  targetVerse: Word[], // The words in the target context
  surfaceLinks: SurfaceLink[], // Denormalized  alignment history
  existingLinks: Link[] // Existing links in the alignment context
): Word[] | undefined {
  if (surfaceLinks.length === 0) {
    return undefined;
  }

  const selectedSurfaceForm = selectedWord.text;

  const matchingPairsSortedByFrequency = surfaceLinks
    .filter((surfaceLink) => {
      return (
        surfaceLink.sourceWords.includes(selectedSurfaceForm) ||
        surfaceLink.targetWords.includes(selectedSurfaceForm)
      );
    })
    .sort((a, b) => b.frequency - a.frequency);

  for (const matchedPair of matchingPairsSortedByFrequency) {
    if (selectedWord.side == AlignmentSide.SOURCE) {
      const matchedWords = targetVerse.filter((targetWord: Word): boolean => {
        return targetWord.text === matchedPair.targetWords[0];
      });

      for (const matchedWord of matchedWords) {
        if (
          matchedWord &&
          !linkExistsForWord(
            matchedWord.id,
            existingLinks,
            AlignmentSide.TARGET
          )
        ) {
          return [matchedWord];
        }
      }
    }

    if (selectedWord.side == AlignmentSide.TARGET) {
      const matchedWords = sourceVerse.filter((sourceWord: Word) => {
        return sourceWord.text === matchedPair.sourceWords[0];
      });

      for (const matchedWord of matchedWords) {
        if (
          matchedWord &&
          !linkExistsForWord(
            matchedWord.id,
            existingLinks,
            AlignmentSide.SOURCE
          )
        ) {
          return [matchedWord];
        }
      }
    }
  }
}
