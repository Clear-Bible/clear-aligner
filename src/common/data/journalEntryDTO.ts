import { ServerAlignmentLinkDTO } from './serverAlignmentLinkDTO';
import { Operation } from 'rfc6902';

export enum JournalEntryType {
  CREATE = 'CREATE',
  BULK_INSERT = 'BULK_INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

/**
 * journal entry
 */
export interface JournalEntryDTO {
  id?: string;
  linkId?: string;
  type: JournalEntryType;
  date: Date;
  body: ServerAlignmentLinkDTO | ServerAlignmentLinkDTO[] | Operation[];
}

export interface JournalEntry {
  id: string;
  linkId: string;
  type: JournalEntryType;
  date: Date;
  body: string;
}
/**
 * convert a journal entry entity into a dto
 * @param je entity object
 */
export const mapJournalEntryEntityToJournalEntryDTO = (
  je: JournalEntry
): JournalEntryDTO => {
  const parsed = JSON.parse(je.body);
  return {
    ...je,
    body: Array.isArray(parsed)
      ? (parsed as Operation[])
      : (parsed as ServerAlignmentLinkDTO),
  };
};
