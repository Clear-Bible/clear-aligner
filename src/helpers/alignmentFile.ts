/**
 * This file contains the saveAlignmentFile function that's called in the
 * Projects Mode to save alignment data.
 */
import { AlignmentFile, AlignmentRecord } from '../structs/alignmentFile';
import { Link, LinkStatus } from '../structs';


export const saveAlignmentFile = (links: Link[] | undefined) => {
  if (!links) return;
  // create starting instance
  const alignmentExport: AlignmentFile = {
    type: 'translation',
    meta: {
      creator: 'ClearAligner'
    },
    records: links
      .filter(Boolean)
      .filter(link => link.id)
      .map(
        (link): AlignmentRecord =>
          ({
            meta: {
              id: link.id,
              ...link.metadata
            },
            source: (link.sources ?? []),
            target: (link.targets ?? [])
          } as AlignmentRecord)
      )
  };

  // Create alignment file content
  const fileContent = JSON.stringify(
    alignmentExport,
    undefined,
    2
  );

  // Create a Blob from the data
  const blob = new Blob([fileContent], {
    type: 'application/json'
  });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement('a');
  const currentDate = new Date();

  // Set the download attribute and file name
  link.download = `alignment_data_${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(
    2,
    '0'
  )}T${String(currentDate.getHours()).padStart(2, '0')}_${String(
    currentDate.getMinutes()
  ).padStart(2, '0')}.json`;

  // Set the href attribute to the generated URL
  link.href = url;

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click event on the link
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  // Revoke the URL to free up resources
  URL.revokeObjectURL(url);
};

/**
 * Alignment check results, including error messages and validated data.
 */
export interface AlignmentFileCheckResults {
  maxErrorMessages: number,
  isFileValid: boolean;
  errorMessages: string[];
  submittedLinks: number,
  acceptedLinks: number,
  rejectedLinks: number,
  validatedFile: AlignmentFile;
}

/**
 * Validates supplied alignment file and returns results, including errors and a validated version of the input data.
 * @param inputFile Input file text that may or may not be an alignment file.
 * @param maxErrorMessages Max error messages to generate.
 */
export const checkAlignmentFile = (inputFile: string, maxErrorMessages = 100): AlignmentFileCheckResults => {
  const result: AlignmentFileCheckResults = {
    maxErrorMessages,
    isFileValid: false,
    errorMessages: [],
    submittedLinks: 0,
    acceptedLinks: 0,
    rejectedLinks: 0,
    validatedFile: {
      type: '',
      meta: {
        creator: ''
      },
      records: []
    }
  };
  let inputJson: any = {};
  try {
    inputJson = JSON.parse(inputFile);
  } catch (ex) {
    result.errorMessages.push(`Input file is not valid JSON: ${(ex as any)?.message ?? ex}`);
    return result;
  }
  result.isFileValid = true;
  result.validatedFile.type = inputJson?.type ?? '';
  result.validatedFile.meta = inputJson?.meta ?? {
    creator: ''
  };
  if (Array.isArray(inputJson?.records)) {
    const linkArray = (inputJson?.records as any[]);
    result.submittedLinks = linkArray.length;
    linkArray.forEach((arrayEntry, entryIndex) => {
      const linkNum = (entryIndex + 1);
      const possibleRecord = arrayEntry as AlignmentRecord | undefined;
      const possibleOrigin = (possibleRecord?.meta?.origin as string | undefined);
      let isRecordValid = true;
      if (!possibleOrigin) {
        isRecordValid = false;
        result.errorMessages.length < maxErrorMessages
        && result.errorMessages.push(`Link #${linkNum.toLocaleString()} has no origin (missing/empty "meta.origin" field).`);
      }
      const possibleStatus = (possibleRecord?.meta?.status as string | undefined);
      if (!possibleStatus || !(camelCaseToSnakeCase(possibleStatus ?? '').toUpperCase() in LinkStatus)) {
        isRecordValid = false;
        result.errorMessages.length < maxErrorMessages
        && result.errorMessages.push(`Link #${linkNum.toLocaleString()} has no valid status (missing/invalid "meta.status" field).`);
      }
      const possibleSource = (possibleRecord?.source as string[] | undefined);
      if (!possibleSource || (possibleSource?.length ?? 0) < 1) {
        isRecordValid = false;
        result.errorMessages.length < maxErrorMessages
        && result.errorMessages.push(`Link #${linkNum.toLocaleString()} has no source tokens (missing/empty "source" field).`);
      }
      const possibleTarget = (possibleRecord?.target as string[] | undefined);
      if (!possibleTarget || (possibleTarget?.length ?? 0) < 1) {
        isRecordValid = false;
        result.errorMessages.length < maxErrorMessages
        && result.errorMessages.push(`Link #${linkNum.toLocaleString()} has no target tokens (missing/empty "target" field).`);
      }
      if (isRecordValid) {
        result.validatedFile.records.push(possibleRecord as AlignmentRecord);
        result.acceptedLinks++;
      } else {
        result.isFileValid = false;
        result.rejectedLinks++;
      }
    });
  } else {
    result.isFileValid = false;
    result.errorMessages.length < maxErrorMessages
    && result.errorMessages.push('Input file has no alignment links (missing/empty "records" field).');
  }
  return result;
};

/**
 * Transform Link State from camel case to snake case
 */
function camelCaseToSnakeCase(str: string){
  return str.replace(/[A-Z]/g, (letter: string) => `_${letter.toLowerCase()}`);
}
