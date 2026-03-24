/**
 * This file contains the singularizeAlignmentPolarityField helper function, which is not
 * currently used.
 */
import { AlignmentPolarity } from 'structs';

const singularizeField = (field: string): 'source' | 'target' => {
  if (field === 'sources') {
    return 'source';
  }

  if (field === 'targets') {
    return 'target';
  }

  throw new Error(
    `Field name given to the polarity singulizer that doesn't make sense: ${field}`
  );
};

const singularizeAlignmentPolarityField = (
  polarity: AlignmentPolarity,
  field: 'syntaxSide' | 'nonSyntaxSide' | 'mappedSide' | 'nonMappedSide'
): 'source' | 'target' => {
  if (
    polarity.type === 'primary' &&
    (field === 'syntaxSide' || field === 'nonSyntaxSide')
  ) {
    return singularizeField(polarity[field]);
  }

  if (
    polarity.type === 'secondary' &&
    (field === 'mappedSide' || field === 'nonMappedSide')
  ) {
    return singularizeField(polarity[field]);
  }
  throw new Error(
    `Unable to singularize: ${JSON.stringify(polarity, null, 2)} ${field}`
  );
};

export default singularizeAlignmentPolarityField;
