/**
 * This file contains the cssVar helper function which programmatically sets
 * css styling based on night or day.
 */
const cssVar = (variableName: string, theme: 'night' | 'day'): string => {
  return `var(--${theme}-${variableName})`;
};

export default cssVar;
