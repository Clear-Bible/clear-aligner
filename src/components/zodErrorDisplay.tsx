import { ZodError, ZodIssue } from 'zod';
import { Typography } from '@mui/material';

export interface ZodErrorDisplayProps {
  errors?: ZodError<any>
}

export const ZodErrorDisplay = ({ errors }: ZodErrorDisplayProps) => (
  <>
    {errors &&
      <Typography
        component={'span'}
        color={'red'} >
        <ul>
          {errors.issues
            .slice(0, 10)
            .filter((iss: ZodIssue) => !!iss.message)
            .map((issue: ZodIssue) => (
              <li key={issue.path.join('.')}>{`'.${issue.path.join('.')}': ${issue.message.toLowerCase()}`}</li>
            ))}
        </ul>
      </Typography>}
  </>
);