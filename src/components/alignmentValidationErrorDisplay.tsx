import { Typography } from '@mui/material';
import { AlignmentFileCheckResults } from '../helpers/alignmentFile';

export interface AlignmentErrorDisplayProps {
  checkResults?: AlignmentFileCheckResults;
}

/**
 * Displays errors resulting from alignment validation
 * @param checkResults validation results, including errors.
 */
export const AlignmentValidationErrorDisplay = ({
  checkResults,
}: AlignmentErrorDisplayProps) => {
  const errorMessages = checkResults?.errorMessages;
  return (
    <>
      {errorMessages && (
        <Typography component={'span'} color={'error'}>
          <ul>
            {errorMessages.map((errorMessage, errorIdx) => {
              const errorKey = `error-${errorIdx}`;
              return <li key={errorKey}>{errorMessage}</li>;
            })}
          </ul>
          {errorMessages.length < checkResults?.rejectedLinks &&
            `+ ${(
              checkResults?.rejectedLinks - errorMessages.length
            ).toLocaleString()} more validation errors.`}
        </Typography>
      )}
    </>
  );
};
