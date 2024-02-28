import { Link } from '../structs';

export enum AlignmentMode {
  CleanSlate = 'cleanSlate', // empty state
  Create = 'create', // creating a new link
  PartialCreate = 'partialCreate', // creating a new link, but only zero or one side has been selected
  Edit = 'edit', // An existing link has been selected, includes both sides
  PartialEdit = 'partialEdit', // Only zero or one 'side' has been selected, but id is present
}

export interface AlignmentState {
  inProgressLink: Link | null;
  mode: AlignmentMode;
}
