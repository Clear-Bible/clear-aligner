import { VirtualTableLinks } from './links/tableManager';
import { UserPreferenceTable } from './preferences/tableManager';

/**
 * intended to provide a single place to keep track of
 * PouchDB "tables" (databases)
 */
export interface ProjectState {
  linksTable?: VirtualTableLinks;
  userPreferences?: UserPreferenceTable;
}

/**
 * intended to provide functionality common to any virtual table
 *
 * A virtual table will be implemented to support storing data across one or more pouchdb databases and should provide a
 * higher level abstraction that allows the application code to interface directly with the objects that it consumes
 * or produces without performing any pre- or post-processing
 */
export class VirtualTable {
  lastUpdate: number;

  constructor() {
    this.lastUpdate = Date.now();
  }

  onUpdate = (suppressOnUpdate?: boolean) => {
    if (!suppressOnUpdate) {
      this.lastUpdate = Date.now();
    }
  };
}

// Table factories
