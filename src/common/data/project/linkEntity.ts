import { LinkOrigin, LinkStatus } from '../../../structs';

/**
 * Link class that links the sources_text to the targets_text used to define the
 * links table.
 */
export class LinkEntity {
  id?: string;
  origin: LinkOrigin;
  status: LinkStatus;
  notes: string;
  sources_text?: string;
  targets_text?: string;

  constructor() {
    this.id = undefined;
    this.origin = 'manual';
    this.status = LinkStatus.CREATED;
    this.notes = '[]';
    this.sources_text = undefined;
    this.targets_text = undefined;
  }
}
