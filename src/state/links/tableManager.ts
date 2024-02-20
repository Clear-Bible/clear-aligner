import { AlignmentSide, Link } from '../../structs';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import { DatabaseStatus, InitialDatabaseStatus, VirtualTable } from '../databaseManagement';
import uuid from 'uuid-random';
import _ from 'lodash';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlignmentFile, AlignmentRecord } from '../../structs/alignmentFile';
import { createCache, MemoryCache, memoryStore } from 'cache-manager';
import { AppContext } from 'App';
import { useInterval } from 'usehooks-ts';
import { DatabaseApi } from '../../hooks/useDatabase';

const DatabaseInsertChunkSize = 10_000;
const UIInsertChunkSize = DatabaseInsertChunkSize * 2;
const DatabaseSelectChunkSize = 25_000;
const DatabaseRefreshIntervalInMs = 500;
const DatabaseCacheTTLMs = 600_000;
const DatabaseCacheMaxSize = 1_000;
export const EmptyWordId = '00000000000';
export const DefaultProjectName = 'default';
export const LinkTableName = 'links';
const LogDatabaseHooks = true;
const PreloadVerseRange = 3;

const dbApi: DatabaseApi = (window as any).databaseApi! as DatabaseApi;


export class LinksTable extends VirtualTable {
  private static latestLastUpdateTime?: number;
  private static latestDatabaseStatus = { ..._.cloneDeep(InitialDatabaseStatus) };
  private static readonly linksByWordIdCache: MemoryCache = createCache(memoryStore(), {
    ttl: DatabaseCacheTTLMs,
    max: DatabaseCacheMaxSize
  });
  private static readonly linksByBCVCache: MemoryCache = createCache(memoryStore(), {
    ttl: DatabaseCacheTTLMs,
    max: DatabaseCacheMaxSize
  });
  private static readonly linksByLinkIdCache: MemoryCache = createCache(memoryStore(), {
    ttl: DatabaseCacheTTLMs,
    max: DatabaseCacheMaxSize
  });
  private sourceName?: string;

  constructor(sourceName?: string) {
    super();
    this.sourceName = sourceName;
  }

  setSourceName = (sourceName?: string) => {
    this.sourceName = sourceName ?? this.sourceName ?? DefaultProjectName;
  };

  getSourceName = () => this.sourceName ?? DefaultProjectName;

  save = async (link: Link, suppressOnUpdate = false, isForced = false): Promise<boolean> => {
    if (!isForced && this.isDatabaseBusy()) {
      return false;
    }

    this.logDatabaseTime('save()');
    try {
      await this.remove(link.id, true, true);
      const newLink: Link = {
        id: link.id ?? uuid(),
        sources: (link.sources ?? []).map(BCVWP.sanitize),
        targets: (link.targets ?? []).map(BCVWP.sanitize)
      };

      await this.checkDatabase();
      // @ts-ignore
      const result = await window.databaseApi.save(this.getSourceName(), LinkTableName, newLink);
      // @ts-ignore
      await window.databaseApi.updateLinkText(this.getSourceName(), newLink.id);
      await this._onUpdate(suppressOnUpdate);
      return result;
    } catch (e) {
      return false;
    }
  };

  exists = async (linkId?: string): Promise<boolean> => {
    if (!linkId) return false;
    // @ts-ignore
    return !!(await window.databaseApi.existsById(this.getSourceName(), LinkTableName, linkId));
  };

  removeAll = async (suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this.isDatabaseBusy()) {
      return false;
    }

    this.logDatabaseTime('removeAll()');
    this.incrDatabaseBusyCtr();
    this.setDatabaseBusyText('Removing old links...');
    try {
      await this.checkDatabase();
      // @ts-ignore
      const result = await window.databaseApi.deleteAll(this.getSourceName(), LinkTableName);
      await this._onUpdate(suppressOnUpdate);
      return result;
    } catch (ex) {
      console.error('error removing all links', ex);
      return false;
    } finally {
      this.decrDatabaseBusyCtr();
      this.logDatabaseTimeEnd('removeAll()');
    }
  };

  saveAlignmentFile = async (alignmentFile: AlignmentFile,
                             suppressOnUpdate = false,
                             isForced = false) =>
    await this.saveAll(alignmentFile.records.map(
      record =>
        ({
          id: LinksTable.createAlignmentRecordId(record),
          sources: record.source,
          targets: record.target
        } as Link)
    ), suppressOnUpdate, isForced);

  saveAll = async (inputLinks: Link[],
                   suppressOnUpdate = false,
                   isForced = false) => {
    // reentry is possible because everything is
    // done in chunks with promises
    if (!isForced && this.isDatabaseBusy()) {
      return false;
    }

    this.logDatabaseTime('saveAll(): complete');
    this.incrDatabaseBusyCtr();
    this.setDatabaseBusyText(`Loading ${inputLinks.length.toLocaleString()} links...`);
    try {
      await this.removeAll(true, true);
      await this.checkDatabase();

      this.setDatabaseBusyText(`Sorting ${inputLinks.length.toLocaleString()} links...`);
      this.logDatabaseTime('saveAll(): sorted');
      const outputLinks = inputLinks.map(link =>
        ({
          id: link.id ?? LinksTable.createLinkId(link),
          sources: (link.sources ?? []).map(BCVWP.sanitize),
          targets: (link.targets ?? []).map(BCVWP.sanitize)
        } as Link));
      outputLinks.sort((l1, l2) =>
        (l1.id ?? EmptyWordId)
          .localeCompare(l2.id ?? EmptyWordId));
      this.logDatabaseTimeEnd('saveAll(): sorted');

      this.logDatabaseTime('saveAll(): saved');
      let progressCtr = 0;
      let progressMax = outputLinks.length;
      this.setDatabaseBusyInfo({
        userText: `Loading ${outputLinks.length.toLocaleString()} links...`,
        progressCtr,
        progressMax
      });
      for (const chunk of _.chunk(outputLinks, UIInsertChunkSize)) {
        await dbApi.insert(this.getSourceName(), LinkTableName, chunk, DatabaseInsertChunkSize);
        progressCtr += chunk.length;
        this.setDatabaseBusyProgress(progressCtr, progressMax);


        const fromLinkTitle = LinksTable.createLinkTitle(chunk[0]);
        const toLinkTitle = LinksTable.createLinkTitle(chunk[chunk.length - 1]);
        this.setDatabaseBusyText(chunk.length === progressMax
          ? `Loading ${fromLinkTitle} to ${toLinkTitle} (${progressCtr.toLocaleString()} links)...`
          : `Loading ${fromLinkTitle} to ${toLinkTitle} (${progressCtr.toLocaleString()} of ${progressMax.toLocaleString()} links)...`);

        this.logDatabaseTimeLog('saveAll(): saved', progressCtr, progressMax);
      }
      this.logDatabaseTimeEnd('saveAll(): saved');

      this.logDatabaseTime('saveAll(): text');
      this.setDatabaseBusyText('Updating link text...');
      await dbApi.updateAllLinkText(this.getSourceName());
      this.logDatabaseTimeEnd('saveAll(): text');

      await this._onUpdate(suppressOnUpdate);
      return true;
    } catch (ex) {
      console.error('error saving all links', ex);
      return false;
    } finally {
      this.decrDatabaseBusyCtr();
      this.logDatabaseTimeEnd('saveAll(): complete');
    }
  };

  /**
   * check if the given word has a link
   * @param side
   * @param wordId
   */
  hasLinkByWord = async (side: AlignmentSide, wordId: BCVWP): Promise<boolean> => (await this.findLinkIdsByWordId(side, wordId)).length > 0;

  findLinkIdsByWordId = async (side: AlignmentSide, wordId: BCVWP): Promise<string[]> =>
    ((await this.findByWordId(side, wordId))
      .map(link => link.id)
      .filter(Boolean) as string[]);

  findByWordId = async (side: AlignmentSide, wordId: BCVWP): Promise<Link[]> => {
    const referenceString = wordId.toReferenceString();
    const cacheKey = [side, referenceString, this.getSourceName(), LinksTable.getLatestLastUpdateTime()].join('|');
    return LinksTable.linksByWordIdCache.wrap(cacheKey, async () => {
      return dbApi.findLinksByWordId(this.getSourceName(), side, referenceString);
    });
  };

  findByBCV = async (side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number): Promise<Link[]> => {
    const cacheKey = [side, bookNum, chapterNum, verseNum, this.getSourceName(), LinksTable.getLatestLastUpdateTime()].join('|');
    return LinksTable.linksByBCVCache.wrap(cacheKey, async () => {
      return dbApi.findLinksByBCV(this.getSourceName(), side, bookNum, chapterNum, verseNum);
    });
  };

  preloadByBCV = (side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number, skipVerseNum: boolean) => {
    for (const verseCtr of this._createVersePreloadRange(verseNum, skipVerseNum)) {
      void this.findByBCV(side, bookNum, chapterNum, verseCtr);
    }
  };

  getAll = async (isForced = false): Promise<Link[]> => {
    if (!isForced && this.isDatabaseBusy()) {
      return [];
    }

    this.logDatabaseTime('getAll()');
    this.incrDatabaseBusyCtr();
    this.setDatabaseBusyText('Saving links...');
    try {
      const results: Link[] = [];
      let offset = 0;
      while (true) {
        const links = ((await dbApi.getAll<Link>(this.getSourceName(), LinkTableName, DatabaseSelectChunkSize, offset)) ?? []);
        this.logDatabaseTimeLog('getAll()', DatabaseSelectChunkSize, offset, links?.length ?? 0);
        if (!links
          || links.length < 1) {
          break;
        }
        for (const link of links) {
          results.push(link);
        }
        this.setDatabaseBusyText(`Saving ${results.length.toLocaleString()} links...`);
        offset += links.length;
        if (links.length < DatabaseSelectChunkSize) {
          break;
        }
      }
      return results;
    } catch (ex) {
      console.error('error getting all links', ex);
      return [];
    } finally {
      this.decrDatabaseBusyCtr();
      this.logDatabaseTimeEnd('getAll()');
    }
  };

  get = async (id?: string): Promise<Link | undefined> => {
    if (!id) return undefined;
    const cacheKey = [id, this.getSourceName(), LinksTable.getLatestLastUpdateTime()].join('|');
    return LinksTable.linksByLinkIdCache.wrap(cacheKey, async () => {
      // @ts-ignore
      return window.databaseApi
        .findOneById(this.getSourceName(), LinkTableName, id);
    });
  };

  remove = async (id?: string, suppressOnUpdate = false, isForced = false) => {
    if (!isForced && this.isDatabaseBusy()) {
      return;
    }

    this.logDatabaseTime('remove()');
    try {
      await this.checkDatabase();
      // @ts-ignore
      const result = await window.databaseApi.deleteByIds(this.getSourceName(), LinkTableName, id ?? '');
      await this._onUpdate(suppressOnUpdate);
      return result;
    } catch (ex) {
      console.error('error removing link', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('remove()');
    }
  };

  reset = async () => {
    try {
      await LinksTable.linksByWordIdCache.reset();
      await LinksTable.linksByBCVCache.reset();
      await LinksTable.linksByLinkIdCache.reset();
      return true;
    } catch (e) {
      console.error('Error clearing links table cache: ', e);
      return false;
    }
  };

  override _onStatusUpdateImpl = () => {
    LinksTable.latestDatabaseStatus = _.cloneDeep(this.databaseStatus);
  };

  override _onUpdateImpl = async (suppressOnUpdate?: boolean) => {
    this.databaseStatus.lastUpdateTime = this.lastUpdateTime;
    LinksTable.latestLastUpdateTime = Math.max(
      (LinksTable.latestLastUpdateTime ?? 0),
      (this.lastUpdateTime ?? 0));
  };

  static getLatestDatabaseStatus = () => ({ ..._.cloneDeep(LinksTable.latestDatabaseStatus) });

  static getLatestLastUpdateTime = () => LinksTable.latestLastUpdateTime;


  /**
   * Checks to see if the database and all tables are loaded and
   * if not, loads it.
   *
   * Returns true if the database or any table was loaded in this step,
   * false otherwise.
   */
  public checkAllTables = async () => {
    this.logDatabaseTime('checkAllTables(): loading');
    try {
      return await this.checkDatabase();
    } finally {
      this.logDatabaseTimeEnd('checkAllTables(): loading');
    }
  };

  _createVersePreloadRange(verseNum: number, skipVerseNum: boolean) {
    const minVerse = Math.max(verseNum - PreloadVerseRange, 1);
    const maxVerse = verseNum + PreloadVerseRange;
    const verseNumbers: number[] = _.range(minVerse, maxVerse)
      .filter(verseCtr => !skipVerseNum || verseCtr !== verseNum);
    verseNumbers.sort((v1, v2) =>
      Math.abs(verseNum - v1) -
      Math.abs(verseNum - v2));
    return verseNumbers;
  }

  static createLinkTitle = (link: Link): string => {
    const bcvwp = BCVWP.parseFromString(link?.targets?.[0] ?? EmptyWordId);
    return `${bcvwp?.getBookInfo()?.ParaText ?? '???'} ${bcvwp.chapter ?? 1}:${bcvwp.verse ?? 1}`;
  };

  static createIdFromWordId = (wordId: string): string => `${BCVWP.sanitize(wordId)}-${uuid()}`;

  /**
   * Creates a prefixed link ID that allows for prefix-based searches.
   * @param link Input link (required).
   */
  static createLinkId = (link: Link): string =>
    LinksTable.createIdFromWordId(link?.targets?.[0] ?? EmptyWordId);

  /**
   * Creates a prefixed alignment record ID that allows for prefix-based searches.
   * @param alignmentRecord Input Alignment record (required).
   */
  static createAlignmentRecordId = (alignmentRecord: AlignmentRecord): string =>
    LinksTable.createIdFromWordId(alignmentRecord?.target?.[0] ?? EmptyWordId);
}

const databaseHookDebug = (text: string, ...args: any[]) => {
  if (LogDatabaseHooks) {
    console.debug(text, ...args);
  }
};

/**
 * Save link hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param link Link to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 */
export const useSaveLink = (link?: Link, saveKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: boolean | undefined;
  }>({});
  const prevSaveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!link
      || !saveKey
      || prevSaveKey.current === saveKey) {
      return;
    }
    prevSaveKey.current = saveKey;
    databaseHookDebug('useSaveLink(): status', status);
    projectState?.linksTable.save(link)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveLink(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, prevSaveKey, link, saveKey, status]);

  return { ...status };
};

/**
 * Import alignment file hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param projectId project id of the alignment file to save
 * @param alignmentFile Alignment file to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 * @param suppressOnUpdate Suppress virtual table update notifications (optional; undefined = true).
 */
export const useImportAlignmentFile = (projectId?: string, alignmentFile?: AlignmentFile, saveKey?: string, suppressOnUpdate: boolean = false) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const prevSaveKey = useRef<string | undefined>();
  const linksTable = useMemo(() => {
    if (!projectId) {
      return projectState.linksTable;
    }
    return new LinksTable(projectId);
  }, [projectId, projectState.linksTable]);

  useEffect(() => {
    if (!alignmentFile
      || !saveKey
      || prevSaveKey.current === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    prevSaveKey.current = saveKey;
    databaseHookDebug('useImportAlignmentFile(): startStatus', startStatus);
    linksTable.saveAlignmentFile(alignmentFile, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useImportAlignmentFile(): endStatus', endStatus);
      });
  }, [linksTable, prevSaveKey, alignmentFile, saveKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Save links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param links Links to save (optional; undefined = no save).
 * @param saveKey Unique key to control save operation (optional; undefined = no save).
 * @param suppressOnUpdate Suppress virtual table update notifications (optional; undefined = true).
 */
export const useSaveAllLinks = (links?: Link[], saveKey?: string, suppressOnUpdate: boolean = true) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const prevSaveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!links
      || !saveKey
      || prevSaveKey.current === saveKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    prevSaveKey.current = saveKey;
    databaseHookDebug('useSaveAllLinks(): startStatus', startStatus);
    projectState?.linksTable.saveAll(links, suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useSaveAllLinks(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, prevSaveKey, links, saveKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Links existence check hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param linkId Link id to check (optional; undefined = no check).
 * @param existsKey Unique key to control check operation (optional; undefined = will check).
 */
export const useLinkExists = (linkId?: string, existsKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: boolean;
  }>({});
  const prevExistsKey = useRef<string | undefined>();

  useEffect(() => {
    const workExistsKey = existsKey ?? uuid();
    if (!linkId
      || prevExistsKey.current === workExistsKey) {
      return;
    }
    prevExistsKey.current = existsKey;
    databaseHookDebug('useLinkExists(): status', status);
    projectState?.linksTable.exists(linkId)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useLinkExists(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, prevExistsKey, existsKey, linkId, status]);

  return { ...status };
};

/**
 * Remove all links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param removeKey Unique key to control remove operation (optional; undefined = no remove).
 * @param suppressOnUpdate Suppress table update notifications (optional; undefined = true).
 */
export const useRemoveAllLinks = (removeKey?: string, suppressOnUpdate: boolean = true) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    isPending: boolean;
  }>({ isPending: false });
  const prevRemoveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!removeKey
      || prevRemoveKey.current === removeKey) {
      return;
    }
    const startStatus = {
      ...status,
      isPending: true
    };
    setStatus(startStatus);
    prevRemoveKey.current = removeKey;
    databaseHookDebug('useRemoveAllLinks(): startStatus', startStatus);
    projectState?.linksTable.removeAll(suppressOnUpdate)
      .then(() => {
        const endStatus = {
          ...startStatus,
          isPending: false
        };
        setStatus(endStatus);
        databaseHookDebug('useRemoveAllLinks(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, prevRemoveKey, removeKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Find links by word ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param side Alignment side to find (optional; undefined = no find).
 * @param wordId Word ID to find (optional; undefined = no find).
 * @param findKey Unique key to control find operation (optional; undefined = will find).
 */
export const useFindLinksByWordId = (side?: AlignmentSide, wordId?: BCVWP, isNoPreload = false, findKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: Link[];
  }>({});
  const prevFindKey = useRef<string | undefined>();

  useEffect(() => {
    const workFindKey = findKey ?? uuid();
    if (!side
      || !wordId
      || prevFindKey.current === workFindKey) {
      return;
    }
    prevFindKey.current = findKey;
    databaseHookDebug('useFindLinksByWordId(): status', status);
    projectState?.linksTable.findByWordId(side, wordId)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        if (!isNoPreload
          && wordId.book
          && wordId.chapter
          && wordId.verse) {
          projectState?.linksTable.preloadByBCV(side, wordId.book, wordId.chapter, wordId.verse, true);
        }
        databaseHookDebug('useFindLinksByWordId(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, isNoPreload, prevFindKey, findKey, side, status, wordId]);

  return { ...status };
};

/**
 * Find links by word ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param side Alignment side to find (optional; undefined = no find).
 * @param bookNum Book number (optional; undefined = no find).
 * @param chapterNum Chapter number (optional; undefined = no find).
 * @param verseNum Verse number  (optional; undefined = no find).
 * @param findKey Unique key to control find operation (optional; undefined = will find).
 */
export const useFindLinksByBCV = (side?: AlignmentSide, bookNum?: number, chapterNum?: number, verseNum?: number, isNoPreload = false, findKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: Link[];
  }>({});
  const prevFindKey = useRef<string | undefined>();

  useEffect(() => {
    const workFindKey = findKey ?? uuid();
    if (!side
      || !bookNum
      || !chapterNum
      || !verseNum
      || prevFindKey.current === workFindKey) {
      return;
    }
    prevFindKey.current = findKey;
    databaseHookDebug('useFindLinksByBCV(): status', status);
    projectState?.linksTable.findByBCV(side, bookNum, chapterNum, verseNum)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        if (!isNoPreload) {
          projectState?.linksTable.preloadByBCV(side, bookNum, chapterNum, verseNum, true);
        }
        databaseHookDebug('useFindLinksByBCV(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, isNoPreload, prevFindKey, findKey, side, bookNum, chapterNum, verseNum, status]);

  return { ...status };
};

/**
 * Get all links hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param projectId optional project name to specify
 * @param getKey Unique key to control get operation (optional; undefined = no get).
 */
export const useGetAllLinks = (projectId?: string, getKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: Link[];
  }>({});
  const prevGetKey = useRef<string | undefined>();
  const linksTable = useMemo(() => {
    if (!projectId) {
      return projectState.linksTable;
    }
    return new LinksTable(projectId);
  }, [projectId, projectState.linksTable]);

  useEffect(() => {
    if (!getKey
      || prevGetKey.current === getKey) {
      return;
    }
    prevGetKey.current = getKey;
    databaseHookDebug('useGetAllLinks(): status', status);
    linksTable.getAll()
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useGetAllLinks(): endStatus', endStatus);
      });
  }, [linksTable, prevGetKey, getKey, status]);

  return { ...status };
};

/**
 * Get link by ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param linkId Link ID to get (optional; undefined = no get).
 * @param getKey Unique key to control get operation (optional; undefined = will get).
 */
export const useGetLink = (linkId?: string, getKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: Link | undefined;
  }>({});
  const prevGetKey = useRef<string | undefined>();

  useEffect(() => {
    const workGetKey = getKey ?? uuid();
    if (!linkId
      || prevGetKey.current === workGetKey) {
      return;
    }
    prevGetKey.current = getKey;
    databaseHookDebug('useGetLink(): status', status);
    projectState?.linksTable.get(linkId)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useGetLink(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, prevGetKey, getKey, linkId, status]);

  return { ...status };
};

/**
 * Remove link by ID hook.
 *<p>
 * Key parameters are used to control operations that may be destructive or time-consuming
 * on re-render. A constant value will ensure an operation only happens once, and a UUID
 * or other ephemeral value will force a refresh. Destructive or time-consuming hooks
 * require key values to execute, others will execute when key parameters are undefined (i.e., by default).
 *<p>
 * @param linkId Link ID to remove (optional; undefined = no remove).
 * @param removeKey Unique key to control remove operation (optional; undefined = no remove).
 * @param suppressOnUpdate Suppress table update notifications (optional; undefined = false).
 */
export const useRemoveLink = (linkId?: string, removeKey?: string, suppressOnUpdate: boolean = false) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] = useState<{
    result?: boolean;
  }>({});
  const prevRemoveKey = useRef<string | undefined>();

  useEffect(() => {
    if (!linkId
      || !removeKey
      || prevRemoveKey.current === removeKey) {
      return;
    }
    prevRemoveKey.current = removeKey;
    databaseHookDebug('useRemoveLink(): status', status);
    projectState?.linksTable.remove(linkId, suppressOnUpdate)
      .then(result => {
        const endStatus = {
          ...status,
          result
        };
        setStatus(endStatus);
        databaseHookDebug('useRemoveLink(): endStatus', endStatus);
      });
  }, [projectState?.linksTable, prevRemoveKey, linkId, removeKey, status, suppressOnUpdate]);

  return { ...status };
};

/**
 * Database status hook.
 */
export const useDatabaseStatus = (checkKey?: string) => {
  const { projectState } = React.useContext(AppContext);
  const [status, setStatus] =
    useState<{
      result: DatabaseStatus
    }>({ result: _.cloneDeep(InitialDatabaseStatus) });
  const prevCheckKey = useRef<string | undefined>();

  useEffect(() => {
    const workCheckKey = checkKey ?? uuid();
    if (!checkKey
      || prevCheckKey.current === workCheckKey) {
      return;
    }
    prevCheckKey.current = workCheckKey;
    const prevStatus = status.result;
    const currStatus = LinksTable.getLatestDatabaseStatus();
    if (currStatus?.busyInfo
      && (currStatus.busyInfo.isBusy
        || !_.isEqual(prevStatus, currStatus))) {
      const endStatus = {
        ...status,
        result: currStatus
      };
      setStatus(endStatus);
      databaseHookDebug('useDatabaseStatus(): endStatus', endStatus);
    }
  }, [projectState?.linksTable, prevCheckKey, checkKey, status]);

  return { ...status };
};

export const useDataLastUpdated = () => {
  const [lastUpdate, setLastUpdate] = useState(0);
  useInterval(() => {
    const latestLastUpdate = LinksTable.getLatestLastUpdateTime();
    if (latestLastUpdate && latestLastUpdate !== lastUpdate) {
      setLastUpdate(latestLastUpdate);
    }
  }, DatabaseRefreshIntervalInMs);

  return lastUpdate;
};

