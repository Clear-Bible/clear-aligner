import { AlignmentSide, Link } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import { IndexedChangeType, SecondaryIndex, VirtualTable } from '../databaseManagement';
import { v4 as uuidv4 } from 'uuid';

export class VirtualTableLinks extends VirtualTable<Link> {
  links: Map<string, Link>;
  sourcesIndex: Map<string, string[]>;
  targetsIndex: Map<string, string[]>;

  constructor() {
    super();
    this.links = new Map<string, Link>();
    this.sourcesIndex = new Map<string, string[]>(); // links a normalized BCVWP reference string to a set of link id strings
    this.targetsIndex = new Map<string, string[]>(); // links a normalized BCVWP reference string to a set of link id strings
  }

  save = (link: Link, suppressOnUpdate?: boolean): Link | undefined => {
    this.remove(link.id); // idempotent operation
    try {
      const newLink: Link = {
        id: link.id ?? uuidv4(),
        sources: link.sources.map(BCVWP.sanitize),
        targets: link.targets.map(BCVWP.sanitize),
      };
      this.links.set(newLink.id!, newLink);
      this._indexLink(newLink);
      void this._updateSecondaryIndices(IndexedChangeType.SAVE, newLink);
      return newLink;
    } catch (e) {
      return undefined;
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
  };

  /**
   * perform indexing on the given link
   * @param link
   */
  _indexLink = (link: Link) => {
    if (!link.id) {
      throw new Error('Cannot index link without an id!');
    }
    // index sources
    link.sources.map(BCVWP.sanitize).forEach((normalizedRefString) => {
      const linksOnSource = this.sourcesIndex.get(normalizedRefString) ?? [];
      if (linksOnSource.includes(link.id!)) {
        return;
      }
      linksOnSource.push(link.id!);
      this.sourcesIndex.set(normalizedRefString, linksOnSource);
    });

    // index targets
    link.targets.map(BCVWP.sanitize).forEach((normalizedRefString) => {
      const linksOnTarget = this.targetsIndex.get(normalizedRefString) ?? [];
      if (linksOnTarget.includes(link.id!)) {
        return;
      }
      linksOnTarget.push(link.id!);
      this.targetsIndex.set(normalizedRefString, linksOnTarget);
    });
  };

  exists = (id?: string): boolean => {
    if (!id) return false;
    return this.links.has(id);
  };

  saveAll = (links: Link[], suppressOnUpdate?: boolean) => {
    try {
      links.forEach((link) => this.save(link, true));
    } catch (x) {
      console.error('error persisting in bulk', x);
    } finally {
      this._onUpdate(suppressOnUpdate);
    }
  };

  /**
   * check if the given word has a link
   * @param side
   * @param wordId
   */
  hasLinkByWord = (side: AlignmentSide, wordId: BCVWP): boolean => {
    const refString = wordId.toReferenceString();
    switch (side) {
      case 'sources':
        return (
          this.sourcesIndex.has(refString) &&
          (this.sourcesIndex.get(refString)?.length ?? 0) > 0
        );
      case 'targets':
        return (
          this.targetsIndex.has(refString) &&
          (this.sourcesIndex.get(refString)?.length ?? 0) > 0
        );
    }
  };

  findLinkIdsByWord = (side: AlignmentSide, wordId: BCVWP): string[] => {
    const refString = wordId.toReferenceString();
    const linkIds: string[] = [];
    switch (side) {
      case 'sources':
        (this.sourcesIndex.get(refString) ?? new Set<string>()).forEach((id) =>
          linkIds.push(id)
        );
        break;
      case 'targets':
        (this.targetsIndex.get(refString) ?? new Set<string>()).forEach((id) =>
          linkIds.push(id)
        );
        break;
    }
    return linkIds;
  };

  findByWord = (side: AlignmentSide, wordId: BCVWP): Link[] =>
    this.findLinkIdsByWord(side, wordId)
      .map(this.get)
      .filter((v) => !!v) as Link[];

  getAll = (): Link[] => Array.from(this.links.values());

  get = (id?: string): Link | undefined => {
    if (!id) return undefined;

    return this.links.get(id);
  };

  remove = (id?: string, suppressOnUpdate?: boolean) => {
    if (!this.exists(id)) return undefined;
    const link = this.links.get(id!)!;

    this._removeIndexes(link);

    this.links.delete(link?.id!);

    this._onUpdate(suppressOnUpdate);
    void this._updateSecondaryIndices(IndexedChangeType.REMOVE, link);
  };

  /**
   * remove the indexes created for a given link
   * @param link
   */
  _removeIndexes = (link?: Link) => {
    if (!link || !link.id) return;

    link.sources.forEach((src) => {
      const associatedLinks = this.sourcesIndex.get(src);
      if (!associatedLinks) return;

      const newAssociatedLinks = associatedLinks.filter((v) => v !== link.id!);

      if (newAssociatedLinks.length < 1) {
        this.sourcesIndex.delete(src);
      } else {
        this.sourcesIndex.set(src, newAssociatedLinks);
      }
    });
    link.targets.forEach((tgt) => {
      const associatedLinks = this.targetsIndex.get(tgt);
      if (!associatedLinks) return;

      const newAssociatedLinks = associatedLinks.filter((v) => v !== link.id!);

      if (associatedLinks.length < 1) {
        this.targetsIndex.delete(tgt);
      } else {
        this.targetsIndex.set(tgt, newAssociatedLinks);
      }
    });
  };

  catchupNewIndex = async (index: SecondaryIndex<Link>): Promise<void> => {
    const indicesPromises: Promise<void>[] = [];
    for (const link of this.links.values()) {
      indicesPromises.push(new Promise<void>((resolve) => {
        setTimeout(() => {
          index.onChange(IndexedChangeType.SAVE, link);
          resolve();
        }, 3);
      }));
    }

    await Promise.all(indicesPromises);
  }
}
