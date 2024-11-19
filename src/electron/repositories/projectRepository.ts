/**
 * This file supports the Project Repository, things like links, corpora, etc
 */
import { ProjectDto } from '../../state/projects/tableManager';
import { GridSortItem } from '@mui/x-data-grid';
import {
  CreateBulkJournalEntryParams,
  DeleteByIdParams,
  DeleteParams,
  InsertParams,
  RepositoryLink,
  LinkStatus,
  SaveParams,
  Corpus
} from '../../structs';
import { PivotWordFilter } from '../../features/concordanceView/concordanceView';
import { Column, DataSource, Entity, EntityManager, EntitySchema, In, PrimaryColumn } from 'typeorm';
import { BaseRepository } from './baseRepository';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import _ from 'lodash';
import { AddLinkStatus1715305810421 } from '../typeorm-migrations/project/1715305810421-add-link-status';
import { AddJournalLinkTable1718060579447 } from '../typeorm-migrations/project/1718060579447-add-journal-link-table';
import uuid from 'uuid-random';
import { createPatch, Operation } from 'rfc6902';
import { mapLinkEntityToServerAlignmentLink, ServerAlignmentLinkDTO } from '../../common/data/serverAlignmentLinkDTO';
import {
  JournalEntry,
  JournalEntryDTO,
  JournalEntryType,
  mapJournalEntryEntityToJournalEntryDTO
} from '../../common/data/journalEntryDTO';
import { generateJsonString } from '../../common/generateJsonString';
import { AddBulkInserts1720060108764 } from '../typeorm-migrations/project/1720060108764-add-bulk-inserts';
import { SERVER_TRANSMISSION_CHUNK_SIZE } from '../../common/constants';
import { AlignmentSide, CorpusDTO, CorpusEntity, CorpusEntityWithLanguage } from '../../common/data/project/corpus';
import { CorporaTimestamps1720241454613 } from '../typeorm-migrations/project/1720241454613-corpora-timestamps';
import {
  JournalEntriesDiffToBody1720419515419
} from '../typeorm-migrations/project/1720419515419-journal-entries-diff-to-body';
import { LinkNote } from '../../common/data/project/linkNote';
import { AddNotesToLinks1728604421335 } from '../typeorm-migrations/project/1728604421335-add-notes-to-links';
import { LinkEntity } from '../../common/data/project/linkEntity';

export const LinkTableName = 'links';
export const CorporaTableName = 'corpora';
export const LanguageTableName = 'language';
export const LinksToSourceWordsName = 'links__source_words';
export const LinksToTargetWordsName = 'links__target_words';
export const DefaultProjectId = '00000000-0000-4000-9000-000000000000';
export const ProjectDatabaseDirectory = 'projects';
export const JournalEntryDirectory = 'journal_entries';
export const JournalEntryTableName = 'journal_entries';

const MaxRmRetries = 10;

/**
 * Journal entry object
 */
@Entity({ name: JournalEntryTableName })
export class JournalEntryEntity {
  @PrimaryColumn({ type: 'text' })
  id?: string;
  @Column({ type: 'text', nullable: true })
  linkId?: string;
  @Column({ type: 'text', nullable: false })
  type: JournalEntryType;
  @Column({ type: 'datetime' })
  date: Date;
  @Column({ nullable: true })
  body?: string;
  @Column({ name: 'bulk_insert_file', nullable: true })
  bulkInsertFile?: string;

  constructor() {
    this.id = '';
    this.linkId = '';
    this.type = JournalEntryType.CREATE;
    this.date = new Date();
    this.body = '';
    this.bulkInsertFile = undefined;
  }
}

/**
 * LinkToSourceWord class used to link source and target words using the link and
 * word ids.
 */
class LinkToSourceWord {
  link_id?: string;
  word_id?: string;

  constructor() {
    this.link_id = undefined;
    this.word_id = undefined;
  }
}

/**
 * LinkToTargetWord class used to link source and target words using the link and
 * word ids.
 */
class LinkToTargetWord {
  link_id?: string;
  word_id?: string;

  constructor() {
    this.link_id = undefined;
    this.word_id = undefined;
  }
}

/**
 * WordsOrParts class represents the individual rows that are in the .tsv files.
 */
class WordsOrParts {
  id?: string;
  corpus_id?: string;
  text: string;
  after?: string;
  gloss: string;
  side: string;
  position_book?: number;
  position_chapter?: number;
  position_verse?: number;
  position_word?: number;
  position_part?: number;
  normalized_text?: string;
  source_verse_bcvid?: string;
  language_id?: string;
  exclude?: number;

  constructor() {
    this.id = undefined;
    this.corpus_id = undefined;
    this.text = '';
    this.after = '';
    this.gloss = '';
    this.side = '';
    this.position_book = undefined;
    this.position_chapter = undefined;
    this.position_verse = undefined;
    this.position_word = undefined;
    this.position_part = undefined;
    this.normalized_text = '';
    this.source_verse_bcvid = undefined;
    this.language_id = undefined;
    this.exclude = undefined;
  }
}

/**
 * LanguageEntity class is used to define the text direction, language and the
 * font family for the corpora.
 */
class LanguageEntity {
  code?: string;
  text_direction?: string;
  font_family?: string;

  constructor() {
    this.code = undefined;
    this.text_direction = '';
    this.font_family = '';
  }
}

const corporaSchema = new EntitySchema({
  name: 'corpora', tableName: CorporaTableName, target: CorpusEntity, columns: {
    id: {
      primary: true, type: 'text', generated: undefined
    },
    side: {
      type: 'text'
    },
    name: {
      type: 'text'
    },
    full_name: {
      type: 'text'
    },
    file_name: {
      type: 'text'
    },
    language_id: {
      type: 'text'
    },
    createdAt: {
      name: 'created_at',
      type: 'datetime',
      createDate: true,
      nullable: true
    },
    updatedSinceSync: {
      name: 'updated_since_sync',
      type: 'int',
      nullable: true
    }
  }
});

const linkSchema = new EntitySchema({
  name: LinkTableName, tableName: LinkTableName, target: LinkEntity, columns: {
    id: {
      primary: true, type: 'text', generated: undefined
    },
    origin: {
      type: 'text'
    },
    status: {
      type: 'text'
    },
    notes: {
      type: 'text'
    },
    sources_text: {
      type: 'text'
    },
    targets_text: {
      type: 'text'
    }
  }
});

const linksToSourceWordsSchema = new EntitySchema({
  name: LinksToSourceWordsName, tableName: LinksToSourceWordsName, target: LinkToSourceWord, columns: {
    link_id: {
      primary: true, type: 'text', generated: undefined
    }, word_id: {
      type: 'text'
    }
  }
});

const linksToTargetWordsSchema = new EntitySchema({
  name: LinksToTargetWordsName, tableName: LinksToTargetWordsName, target: LinkToTargetWord, columns: {
    link_id: {
      primary: true, type: 'text', generated: undefined
    }, word_id: {
      type: 'text'
    }
  }
});

const wordsOrPartsSchema = new EntitySchema({
  name: 'words_or_parts', tableName: 'words_or_parts', target: WordsOrParts, columns: {
    id: {
      primary: true, type: 'text', generated: undefined
    }, corpus_id: {
      type: 'text'
    }, text: {
      type: 'text'
    }, side: {
      type: 'text'
    }, language_id: {
      type: 'text'
    }, after: {
      type: 'text'
    }, gloss: {
      type: 'text'
    }, position_book: {
      type: 'integer'
    }, position_chapter: {
      type: 'integer'
    }, position_verse: {
      type: 'integer'
    }, position_word: {
      type: 'integer'
    }, position_part: {
      type: 'integer'
    }, normalized_text: {
      type: 'text'
    }, source_verse_bcvid: {
      type: 'text'
    }, exclude: {
      type: 'integer'
    }

  }
});


const languageSchema = new EntitySchema({
  name: 'language', tableName: 'language', target: LanguageEntity, columns: {
    code: {
      primary: true, type: 'text', generated: undefined
    }, font_family: {
      type: 'text'
    }, text_direction: {
      type: 'text'
    }
  }
});

export class ProjectRepository extends BaseRepository {

  getDataSource: (sourceName: string) => Promise<DataSource | undefined>;

  constructor() {
    super();
    this.isLoggingTime = true;
    this.dataSources = new Map();
    this.getDataSource = async (projectId: string) => {
      return await this.getDataSourceWithEntities(projectId || DefaultProjectId,
        [corporaSchema, linkSchema, wordsOrPartsSchema, linksToSourceWordsSchema, linksToTargetWordsSchema, languageSchema, JournalEntryEntity],
        path.join(this.getTemplatesDirectory(), DefaultProjectId === projectId
          ? 'projects/clear-aligner-00000000-0000-4000-9000-000000000000.sqlite'
          : 'clear-aligner-template.sqlite'),
        path.join(this.getDataDirectory(), ProjectDatabaseDirectory));
    };
  }


  convertCorpusToDataSource = (corpus: any) => ({
    id: corpus.id,
    side: corpus.side,
    name: corpus.name,
    full_name: corpus.fullName,
    file_name: corpus.fileName,
    language_id: corpus.language?.code
  });

  convertDataSourceToCorpus = (corpus: any) => ({
    id: corpus.id,
    side: corpus.side,
    name: corpus.name,
    fullName: corpus.full_name,
    fileName: corpus.file_name,
    language: {
      code: corpus.language_id
    }
  });

  /**
   * list migrations to be applied to the project databases here. This will be
   * an ever-growing list
   */
  getMigrations = async (): Promise<any[]> => {
    return [
      AddLinkStatus1715305810421,
      AddJournalLinkTable1718060579447,
      AddBulkInserts1720060108764,
      CorporaTimestamps1720241454613,
      JournalEntriesDiffToBody1720419515419,
      AddNotesToLinks1728604421335
    ];
  };

  getDataSources = async () => new Promise((res, err) => {
    const sources: { id: string, corpora: any[] }[] = [];
    try {
      const dataSourceDirectory = path.join(this.getDataDirectory(), ProjectDatabaseDirectory);
      fs.mkdirSync(dataSourceDirectory, { recursive: true });
      fs.readdir(dataSourceDirectory, async (err, files) => {
        if (err) {
          console.error('There was an error accessing the data source directory: ', err);
          return sources;
        }

        for (const file of files) {
          if (!file.endsWith('.sqlite')) continue;
          const sourceName = file.slice(app.getName().length + 1, -7);
          const corpora = await this.getAllCorpora(sourceName);
          sources.push({ id: sourceName, corpora });
        }
        res(sources);
      });
    } catch (ex) {
      console.error('getDataSources()', ex);
      err(sources.flatMap(v => v));
    }
  });

  toggleCorporaUpdatedFlagOff = async (projectId: string) => {
    const src = await this.getDataSource(projectId)!;
    await src?.createQueryBuilder()
      .update(CorporaTableName)
      .set({ updatedSinceSync: 0 })
      .where('updated_since_sync != 0')
      .execute();
  };

  removeTargetWordsOrParts = async (sourceName: string) => {
    await (await this.getDataSource(sourceName))!
      .createQueryBuilder()
      .delete()
      .from(WordsOrParts)
      .where('words_or_parts.side = :side', { side: 'targets' })
      .execute();
  };

  createSourceFromProject = async (project: ProjectDto): Promise<{ id: string, sources: CorpusEntity[] }|undefined> => {
    try {
      // Creates the data source
      const projectDataSource = await this.getDataSource(project.id!);
      // Inserts corpora to the {project.id} data source
      const corpora = [...project.corpora].filter(Boolean);
      await this.insert({
        projectId: project.id!,
        table: CorporaTableName,
        itemOrItems: corpora
      });
      const sources = (await projectDataSource!.getRepository(CorporaTableName)
        .createQueryBuilder(CorporaTableName)
        .getMany()) as CorpusEntity[];
      return {
        id: project.id!, sources
      };
    } catch (ex) {
      console.error('createSourceFromProject()', ex);
    }
  };

  updateSourceFromProject = async (project: ProjectDto) => {
    try {
      const corpora = project.corpora.map(this.convertCorpusToDataSource);
      const dataSource = (await this.getDataSource(project.id!))!;
      const corporaRepository = dataSource.getRepository(CorporaTableName);
      await corporaRepository.save(corpora);
      await dataSource.getRepository(LanguageTableName).upsert(project.corpora.filter(c => c.language).map(c => ({
        code: c.language.code, text_direction: c.language.textDirection, font_family: c.language.fontFamily
      })), ['code']);
      const sources = await dataSource!.getRepository(CorporaTableName)
        .createQueryBuilder(CorporaTableName)
        .getMany();
      return { id: project.id, sources };
    } catch (err) {
      console.error('updateSourceFromProject()', err);
    }
  };

  getFirstBcvFromSource = async (sourceName: string): Promise<{ id?: string }|undefined> => {
    try {
      const entityManager = (await this.getDataSource(sourceName))!.manager;
      const firstBcv = (await entityManager.query(`select replace(id, 'targets:', '') id
                                                  from words_or_parts
                                                  where side = 'targets'
                                                  order by id asc
                                                  limit 1;`)) as { id?: string }[];
      return firstBcv[0];
    } catch (err) {
      console.error('getFirstBcvFromSource()', err);
    }
  };

  hasBcvInSource = async (sourceName: string, bcvId: string): Promise<boolean|undefined> => {
    try {
      const entityManager = (await this.getDataSource(sourceName))!.manager;
      const hasBcv = await entityManager.query(`select count(1) bcv
                                                from words_or_parts
                                                where id like 'targets:${bcvId}%'`);
      return !!hasBcv[0]?.bcv;

    } catch (err) {
      console.error('hasBcvInSource()', err);
    }
  };

  removeSource = async (projectId: string) => {
    this.logDatabaseTime('removeSource()');
    try {
      await this.removeDataSource(projectId);
      this.rmBulkInsertDir(projectId);
      const dbFiles = fs.readdirSync(path.join(this.getDataDirectory(), ProjectDatabaseDirectory));
      const filesToDelete = [];
      for (const dbFile of dbFiles) {
        if (!(dbFile.endsWith('.sqlite')
          || dbFile.endsWith('.sqlite-shm')
          || dbFile.endsWith('.sqlite-wal'))) {
          continue;
        }
        const sourceName = dbFile.slice(app.getName().length + 1);
        if (sourceName.startsWith(projectId)) {
          filesToDelete.push(dbFile);
        }
      }
      for (const fileToDelete of filesToDelete) {
        const pathToDelete = path.join(this.getDataDirectory(), ProjectDatabaseDirectory, fileToDelete);
        this.logDatabaseTimeLog('removeSource()', pathToDelete);
        fs.rmSync(pathToDelete, { recursive: true, force: true, maxRetries: MaxRmRetries });
      }
    } finally {
      this.logDatabaseTimeEnd('removeSource()');
    }
  };

  createDataSource = async (sourceName: string) => {
    this.logDatabaseTime('createDataSource()');
    try {
      const result = !!(await this.getDataSource(sourceName));
      this.logDatabaseTimeLog('createDataSource()', sourceName, result);
      return result;
    } catch (ex) {
      console.error('createDataSource()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('createDataSource()');
    }
  };

  sanitizeWordId(wordId: string) {
    const wordId1 = wordId.trim();
    return !!wordId1.match(/^[onON]\d/) ? wordId1.substring(1) : wordId1;
  }

  createLinksToSource = (links: RepositoryLink[]): LinkToSourceWord[] => {
    const result: LinkToSourceWord[] = [];
    links.forEach(link => {
      const linkId = link.id ?? '';
      return (link.sources ?? [])
        .filter(Boolean)
        .forEach(wordId => {
          const linkToSource = new LinkToSourceWord();
          linkToSource.link_id = linkId;
          linkToSource.word_id = 'sources:' + this.sanitizeWordId(wordId);
          result.push(linkToSource);
        });
    });
    return result;
  };
  createLinksToTarget = (links: RepositoryLink[]): LinkToTargetWord[] => {
    const result: LinkToTargetWord[] = [];
    links.forEach(link => {
      const linkId = link.id ?? '';
      return (link.targets ?? [])
        .filter(Boolean)
        .forEach(wordId => {
          const linkToTarget = new LinkToTargetWord();
          linkToTarget.link_id = linkId;
          linkToTarget.word_id = 'targets:' + this.sanitizeWordId(wordId);
          result.push(linkToTarget);
        });
    });
    return result;
  };

  insert = async <T, >({ projectId, table, itemOrItems, chunkSize, disableJournaling }: InsertParams<T>) => {
    if (!table || !projectId || !itemOrItems) {
      return false;
    }
    this.logDatabaseTime('insert()');
    try {
      await (await this.getDataSource(projectId))!
        .transaction(async (entityManager) => {
          const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
          const chunks = chunkSize ? _.chunk(items, chunkSize) : [items];
          const promises = [];
          for (const chunk of chunks) {
            switch (table) {
              case LinkTableName:
                const linkChunk = (chunk as RepositoryLink[]);
                promises.push(
                  entityManager.getRepository(LinkTableName)
                    .insert(linkChunk.map((link): LinkEntity => ({
                      id: link.id,
                      origin: link.metadata.origin,
                      status: link.metadata.status,
                      notes: generateJsonString(link.metadata.note)
                    }))),
                  entityManager.getRepository(LinksToSourceWordsName)
                    .insert(this.createLinksToSource(linkChunk)),
                  entityManager.getRepository(LinksToTargetWordsName)
                    .insert(this.createLinksToTarget(linkChunk)),
                  disableJournaling ? undefined :
                    entityManager.getRepository(JournalEntryTableName)
                      .insert(linkChunk.map((link): JournalEntryEntity => ({
                        id: uuid(),
                        linkId: link.id,
                        type: JournalEntryType.CREATE,
                        date: new Date(),
                        body: generateJsonString(mapLinkEntityToServerAlignmentLink(link))
                      } as JournalEntryEntity))));
                break;
              case CorporaTableName:
                promises.push(
                  entityManager.getRepository(LanguageTableName)
                    .upsert((chunk as CorpusDTO[]).filter(c => c.language).map(c => ({
                      code: c.language.code,
                      text_direction: c.language.textDirection,
                      font_family: c.language.fontFamily
                    })), ['code']),
                  entityManager.getRepository(CorporaTableName)
                    .insert(chunk.map(this.convertCorpusToDataSource)));
                break;
              default:
                promises.push(entityManager.getRepository(table)
                  .insert(chunk));
                break;
            }
          }
          await Promise.all(promises);
          this.logDatabaseTimeLog('insert()',
            projectId, table, (itemOrItems as T[])?.length ?? itemOrItems,
            chunkSize, chunks?.length, promises?.length);
        });
      return true;
    } catch (ex) {
      console.error('insert()', ex, itemOrItems);
      return false;
    } finally {
      this.logDatabaseTimeEnd('insert()');
    }
  };

  deleteAll = async ({ projectId, table }: DeleteParams) => {
    this.logDatabaseTime('deleteAll()');
    try {
      const dataSource = (await this.getDataSource(projectId))!;
      switch (table) {
        case LinkTableName:
          await dataSource.getRepository(LinksToSourceWordsName)
            .clear();
          await dataSource.getRepository(LinksToTargetWordsName)
            .clear();
          await dataSource.getRepository(LinkTableName)
            .clear();
          break;
        default:
          await dataSource.getRepository(table)
            .clear();
          break;
      }
      this.logDatabaseTimeLog('deleteAll()', projectId, table);
      return true;
    } catch (ex) {
      console.error('deleteAll()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('deleteAll()');
    }
  };

  /**
   * Generate a diff string for link journal entries
   * @param pastLink before
   * @param currentLink after
   */
  generateLinkDiff = (pastLink: RepositoryLink, currentLink: RepositoryLink): Operation[] => createPatch(mapLinkEntityToServerAlignmentLink(pastLink), mapLinkEntityToServerAlignmentLink(currentLink));

  save = async <T, >({ projectId, table, itemOrItems, disableJournaling }: SaveParams<T>) => {
    this.logDatabaseTime('save()');
    try {
      const dataSource = await this.getDataSource(projectId);
      if (!dataSource) throw new Error(`Error retrieving dataSource for ${projectId}`);
      switch (table) {
        case LinkTableName:
          const links = (Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems]) as RepositoryLink[];
          let pastLinks: Map<string, RepositoryLink> = new Map();
          if (!disableJournaling) {
            const tmpIds = links
              .map(({ id }) => id)
              .filter((linkId) => !!linkId && linkId.trim().length > 0) as string[];
            pastLinks = new Map((await this.findLinksById(dataSource, tmpIds))
              .map((link: RepositoryLink) => [link.id!, link]));
          }
          const linksToDelete = links.map(({ id }) => id!);
          await this.deleteByIds({
            projectId: projectId,
            table,
            itemIdOrIds: linksToDelete,
            disableJournaling: true
          });
          const savedLinksTmp = await dataSource.getRepository(LinkTableName)
            .save(links.map((link): Partial<LinkEntity> => ({
              id: link.id,
              origin: link.metadata.origin,
              status: link.metadata.status,
              notes: generateJsonString(link.metadata.note)
            })));
          await dataSource.getRepository(LinksToSourceWordsName)
            .save(this.createLinksToSource(links));
          await dataSource.getRepository(LinksToTargetWordsName)
            .save(this.createLinksToTarget(links));
          if (!disableJournaling) {
            const savedLinks: RepositoryLink[] = await this.findLinksById(dataSource, savedLinksTmp.map(({ id }) => id).filter(v => !!v) as string[]);
            await dataSource.getRepository(JournalEntryEntity)
              .insert(savedLinks
                .map((link) => {
                  const pastLink = link.id && pastLinks.has(link.id) ? pastLinks.get(link.id) : undefined;
                  if (!pastLink) return undefined;
                  const linkDiff = this.generateLinkDiff(pastLink, link);
                  if (linkDiff.length < 1) return undefined;
                  return ({
                    id: uuid(),
                    linkId: link.id,
                    type: JournalEntryType.UPDATE,
                    date: new Date(),
                    body: generateJsonString(linkDiff)
                  } as JournalEntryEntity);
                })
                .filter((entry) => !!entry)
                .map((entry) => entry!));
          }
          break;
        default:
          await dataSource.getRepository(table)
            .save(itemOrItems as { [x: string]: any });
          break;
      }
      this.logDatabaseTimeLog('save()', projectId, table);
      return true;
    } catch (ex) {
      console.error('save()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('save()');
    }
  };

  existsById = async (sourceName: string, table: string, itemId: string): Promise<Boolean> => {
    this.logDatabaseTime('existsById()');
    try {
      const result = await (await this.getDataSource(sourceName))
        ?.getRepository(table)
        .existsBy({ id: itemId });
      this.logDatabaseTimeLog('existsById()', sourceName, table, itemId, result);
      return Boolean(result);
    } catch (ex) {
      console.error('existsById()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('existsById()');
    }
  };

  createLinksFromRows = async (dataSource: DataSource | undefined, linkRows: any[]): Promise<RepositoryLink[]> => {
    if (!linkRows || linkRows.length === 0) {
      return [];
    }
    const results = [];
    let currLink: Partial<RepositoryLink> = {
      id: undefined,
      sources: [],
      targets: []
    };
    const linkIds: string[] = linkRows.map(({ link_id }) => link_id);
    const linkMetaDataRows: LinkEntity[] = [];
    for (const linkIdChunk of _.chunk(linkIds, 100)) {
      (await dataSource?.manager.findByIds(LinkEntity, linkIdChunk))
        ?.forEach((row) => {
          linkMetaDataRows.push(row);
        });
    }
    const metadata = new Map(linkMetaDataRows
      .map((row) => ([row.id, row])));
    linkRows.forEach(linkRow => {
      if (currLink.id && currLink.id !== linkRow.link_id) {
        results.push(currLink);
        currLink = {
          id: undefined,
          sources: [],
          targets: []
        };
      }
      currLink.id = linkRow.link_id;
      const linkRowMetadata = metadata.get(currLink.id)!;
      currLink.metadata = {
        origin: linkRowMetadata.origin,
        status: linkRowMetadata.status,
        note: JSON.parse(linkRowMetadata?.notes ?? '[]') as LinkNote[]
      };
      // normal find* methods
      if (linkRow.type) {
        switch (linkRow.type) {
          case 'sources':
            currLink.sources = JSON.parse(linkRow.words);
            break;
          case 'targets':
            currLink.targets = JSON.parse(linkRow.words);
            break;
        }
        // findLinksByWordId,findLinksByBCV
      } else {
        currLink.sources = JSON.parse(linkRow.sources);
        currLink.targets = JSON.parse(linkRow.targets);
      }
    });
    if (currLink.id) {
      results.push(currLink as RepositoryLink);
    }
    return results;
  };

  findLinksById = async (dataSource: DataSource, linkIdOrIds: string | string[]): Promise<RepositoryLink[]> => {
    if (!linkIdOrIds) {
      return [];
    }
    const linkIds = Array.isArray(linkIdOrIds) ? linkIdOrIds : [linkIdOrIds];
    if (linkIds.length < 1) {
      return [];
    }
    const entityManager = dataSource.manager;
    const rows = [];
    for (const linkId of linkIds) {
      for (const row of ((await entityManager.query(`select q.link_id, q.type, q.words
                                                     from (select lsw.link_id                                             as link_id,
                                                                  'sources'                                               as type,
                                                                  json_group_array(replace(lsw.word_id, 'sources:', ''))
                                                                                   filter (where lsw.word_id is not null) as words
                                                           from links__source_words lsw
                                                           where lsw.link_id = :linkId
                                                           group by lsw.link_id
                                                           union
                                                           select ltw.link_id                                             as link_id,
                                                                  'targets'                                               as type,
                                                                  json_group_array(replace(ltw.word_id, 'targets:', ''))
                                                                                   filter (where ltw.word_id is not null) as words
                                                           from links__target_words ltw
                                                           where ltw.link_id = :linkId
                                                           group by ltw.link_id) q
                                                     order by q.link_id;`, [{ linkId }])) ?? [])) {
        rows.push(row);
      }
    }
    return await this.createLinksFromRows(dataSource, rows);
  };

  findLinksBetweenIds = async (dataSource: DataSource, fromLinkId: string, toLinkId: string) => {
    if (!fromLinkId || !toLinkId) {
      return [];
    }
    return await this.createLinksFromRows(dataSource, (await dataSource.manager.query(`select l.id                                     link_id,
                                                                                              json_group_array(
                                                                                                replace(lsw.word_id, 'sources:', ''))
                                                                                                filter (where lsw.word_id is not null) sources,
                                                                                              json_group_array(
                                                                                                replace(ltw.word_id, 'targets:', ''))
                                                                                                filter (where ltw.word_id is not null) targets
                                                                                       from links l
                                                                                              left join links__source_words lsw on l.id = lsw.link_id
                                                                                              left join links__target_words ltw on l.id = ltw.link_id
                                                                                       where l.id >= ?
                                                                                         and l.id <= ?
                                                                                       group by l.id
                                                                                       order by l.id;`, [fromLinkId, toLinkId])));
  };

  findLinksByWordId = async (sourceName: string, linkSide: AlignmentSide, wordId: string) => {
    if (!linkSide || !wordId) {
      return undefined;
    }
    this.logDatabaseTime('findLinksByWordId()');
    try {
      let firstTableName;
      let secondTableName;
      switch (linkSide) {
        case 'sources':
          firstTableName = 'source';
          secondTableName = 'target';
          break;
        case 'targets':
          firstTableName = 'target';
          secondTableName = 'source';
          break;
        default:
          return [];
      }
      const queryWordId = `${linkSide}:${wordId}`;
      const dataSource = (await this.getDataSource(sourceName))!;
      const entityManager = dataSource.manager;
      const results = await this.createLinksFromRows(dataSource, (await entityManager.query(`select t1.link_id,
                                                                                                    json_group_array(
                                                                                                      replace(t1.word_id, '${firstTableName}s:', ''))
                                                                                                      filter (where t1.word_id is not null) '${firstTableName}s',
                                                                                                    json_group_array(
                                                                                                      replace(t2.word_id, '${secondTableName}s:', ''))
                                                                                                      filter (where t2.word_id is not null) '${secondTableName}s'
                                                                                             from 'links__${firstTableName}_words' t1
                                                                                                    left join 'links__${secondTableName}_words' t2 on t1.link_id = t2.link_id
                                                                                             where t1.word_id = ?;`, [queryWordId])));
      this.logDatabaseTimeLog('findLinksByWordId()', sourceName, linkSide, wordId, results?.length ?? 0);
      return results;
    } catch (ex) {
      console.error('findLinksByWordId()', ex);
    } finally {
      this.logDatabaseTimeEnd('findLinksByWordId()');
    }
  };

  findLinksByBCV = async (sourceName: string, side: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number) => {
    if (!bookNum || !chapterNum || !verseNum) {
      return [];
    }
    const workSide = side ?? 'targets'; // default to targets
    const workPart1 = (workSide === 'targets') ? 'target' : 'source';
    const workPart2 = (workPart1 === 'target') ? 'source' : 'target';
    this.logDatabaseTime('findLinksByBCV()');
    try {
      const dataSource = (await this.getDataSource(sourceName))!;
      const entityManager = dataSource.manager;
      const results = await this.createLinksFromRows(dataSource, (await entityManager.query(`select q2.link_id, q2.type, q2.words
                                                                                             from (with q1(link_id)
                                                                                                          as (select distinct jtq.link_id
                                                                                                              from words_or_parts w
                                                                                                                     inner join 'links__${workPart1}_words' jtq on jtq.word_id = w.id
                                                                                                              where w.side = :workSide
                                                                                                                and w.position_book = :bookNum
                                                                                                                and w.position_chapter = :chapterNum
                                                                                                                and w.position_verse = :verseNum)
                                                                                                   select q1.link_id                               as link_id,
                                                                                                          '${workPart1}s'                          as type,
                                                                                                          json_group_array(
                                                                                                            replace(jt1.word_id, '${workPart1}s:', ''))
                                                                                                            filter (where jt1.word_id is not null) as words
                                                                                                   from 'links__${workPart1}_words' jt1
                                                                                                          inner join q1 on jt1.link_id in (q1.link_id)
                                                                                                   group by q1.link_id
                                                                                                   union
                                                                                                   select q1.link_id                               as link_id,
                                                                                                          '${workPart2}s'                          as type,
                                                                                                          json_group_array(
                                                                                                            replace(jt2.word_id, '${workPart2}s:', ''))
                                                                                                            filter (where jt2.word_id is not null) as words
                                                                                                   from 'links__${workPart2}_words' jt2
                                                                                                          inner join q1 on jt2.link_id in (q1.link_id)
                                                                                                   group by q1.link_id) q2
                                                                                             order by q2.link_id;`,
        [{ workSide, bookNum, chapterNum, verseNum }])));
      this.logDatabaseTimeLog('findLinksByBCV()', sourceName, side, bookNum, chapterNum, verseNum, results?.length ?? results);
      return results;
    } catch (ex) {
      console.error('findLinksByBCV()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('findLinksByBCV()');
    }
  };

  findWordsByBCV = async (sourceName: string, linkSide: AlignmentSide, bookNum: number, chapterNum: number, verseNum: number) => {
    if (!linkSide || !bookNum || !chapterNum || !verseNum) {
      return [];
    }
    this.logDatabaseTime('findWordsByBCV()');
    try {
      const entityManager = (await this.getDataSource(sourceName))!.manager;
      const results = (await entityManager.query(`select replace(w.id, '${linkSide}:', '') as id,
                                                         w.corpus_id                       as corpusId,
                                                         w.side                            as side,
                                                         w.text                            as text,
                                                         w.after                           as after,
                                                         w.position_part                   as position
                                                  from words_or_parts w
                                                  where w.side = ?
                                                    and w.position_book = ?
                                                    and w.position_chapter = ?
                                                    and w.position_verse = ?;`, [linkSide, bookNum, chapterNum, verseNum]));
      this.logDatabaseTimeLog('findWordsByBCV()', sourceName, linkSide, bookNum, chapterNum, verseNum, results?.length ?? results);
      return results;
    } catch (ex) {
      console.error('findWordsByBCV()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('findWordsByBCV()');
    }
  };

  getAllWordsByCorpus = async (sourceName: string, linkSide: AlignmentSide, corpusId: string, wordLimit: number, wordSkip: number) => {
    if (!linkSide || !wordLimit) {
      return [];
    }
    this.logDatabaseTime('getAllWordsByCorpus()');
    try {
      const entityManager = (await this.getDataSource(sourceName))!.manager;
      const results = (await entityManager.query(`select replace(w.id, '${linkSide}:', '') as id,
                                                         w.corpus_id                       as corpusId,
                                                         w.side                            as side,
                                                         w.text                            as text,
                                                         w.gloss                           as gloss,
                                                         w.after                           as after,
                                                         w.position_part                   as position,
                                                         w.source_verse_bcvid              as sourceVerse,
                                                         w.normalized_text                 as normalizedText,
                                                         CASE WHEN w.exclude = 1 THEN 1 ELSE 0 END AS exclude
                                                  from words_or_parts w
                                                  where w.side = ?
                                                    and w.corpus_id = ?
                                                  order by w.id
                                                  limit ? offset ?;`, [linkSide, corpusId, wordLimit, wordSkip ?? 0]));
      this.logDatabaseTimeLog('getAllWordsByCorpus()', sourceName, linkSide, corpusId, wordLimit, wordSkip, results?.length ?? results);
      return results;
    } catch (ex) {
      console.error('getAllWordsByCorpus()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('getAllWordsByCorpus()');
    }
  };

  getAllCorpora = async (sourceName: string): Promise<Partial<Corpus>[]> => {
    this.logDatabaseTime('getAllCorpora()');
    try {
      const entityManager: EntityManager = (await this.getDataSource(sourceName))!.manager;
      const results = (await entityManager.query<CorpusEntityWithLanguage[]>(`select c.id                 as id,
                                                         c.name               as name,
                                                         c.full_name          as full_name,
                                                         c.file_name          as file_name,
                                                         c.side               as side,
                                                         c.created_at         as createdat,
                                                         c.updated_since_sync as updated_since_sync,
                                                         l.code               as code,
                                                         l.text_direction     as textDirection,
                                                         l.font_family        as fontFamily
                                                  from corpora c
                                                         inner join language l on c.language_id = l.code;`));
      this.logDatabaseTimeLog('getAllCorpora()', sourceName, results?.length ?? results);
      return (results ?? [])
        .filter(Boolean)
        .map((result): Partial<Corpus> =>
          ({
            id: result.id,
            name: result.name,
            fileName: result.file_name,
            fullName: result.full_name,
            side: result.side,
            createdAt: result.createdAt ? new Date(result.createdAt) : undefined,
            updatedSinceSync: result.updated_since_sync,
            language: {
              code: result.code, textDirection: result.textDirection, fontFamily: result.fontFamily
            }
          }));
    } catch (ex) {
      console.error('getAllCorpora()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('getAllCorpora()');
    }
  };

  getJournalEntryDTOFromJournalEntryEntity = (projectId: string, journalEntryEntity: JournalEntryEntity, dontDeleteFiles = false): JournalEntryDTO => {
    if (journalEntryEntity.type !== JournalEntryType.BULK_INSERT) return mapJournalEntryEntityToJournalEntryDTO(journalEntryEntity as JournalEntry);
    const bulkInsertFilePath = this.getBulkInsertFilePath(projectId, journalEntryEntity.bulkInsertFile!);
    const serverAlignmentLinks = JSON.parse(fs.readFileSync(bulkInsertFilePath, 'utf8')) as ServerAlignmentLinkDTO[];
    if (!dontDeleteFiles) {
      this.rmBulkInsertFile(projectId, journalEntryEntity.bulkInsertFile!, true);
    }
    return {
      id: journalEntryEntity.id,
      linkId: undefined,
      type: journalEntryEntity.type,
      date: journalEntryEntity.date,
      body: serverAlignmentLinks
    };
  };

  getAllJournalEntries = async (projectId: string, itemLimit?: number, itemSkip?: number): Promise<JournalEntryDTO[]> => {
    const src = (await this.getDataSource(projectId))!;
    const queryBuilder = src
      .getRepository<JournalEntryEntity>(JournalEntryTableName)
      .createQueryBuilder();
    queryBuilder.orderBy({
      date: 'ASC'
    });
    if (itemLimit) queryBuilder.take(itemLimit);
    if (itemSkip) queryBuilder.skip(itemSkip);
    return (await queryBuilder.getMany())
      .filter(Boolean)
      .map((journalEntry) => this.getJournalEntryDTOFromJournalEntryEntity(projectId, journalEntry));
  };

  getAllLinks = async (dataSource: DataSource, itemLimit?: number, itemSkip?: number) => await this.createLinksFromRows(dataSource, (await dataSource.manager.query(`select q.link_id,
                                                                                                                                                                                      MAX(q.sources) as sources,
                                                                                                                                                                                      MAX(q.targets) as targets
                                                                                                                                                                               from (select lsw.link_id                              as link_id,
                                                                                                                                                                                            json_group_array(
                                                                                                                                                                                              replace(lsw.word_id, 'sources:', ''))
                                                                                                                                                                                              filter (where lsw.word_id is not null) as sources,
                                                                                                                                                                                            null                                     as targets
                                                                                                                                                                                     from links__source_words lsw
                                                                                                                                                                                     group by lsw.link_id
                                                                                                                                                                                     union
                                                                                                                                                                                     select ltw.link_id                              as link_id,
                                                                                                                                                                                            null                                     as sources,
                                                                                                                                                                                            json_group_array(
                                                                                                                                                                                              replace(ltw.word_id, 'targets:', ''))
                                                                                                                                                                                              filter (where ltw.word_id is not null) as targets
                                                                                                                                                                                     from links__target_words ltw
                                                                                                                                                                                     group by ltw.link_id) q
                                                                                                                                                                               group by link_id
                                                                                                                                                                               order by q.link_id
                                                                                                                                                                               limit ? offset ?;`, [itemLimit, itemSkip])));

  updateLinkText = async (sourceName: string, linkIdOrIds: string | string[]) => {
    if (!linkIdOrIds) {
      return [];
    }
    const linkIds = Array.isArray(linkIdOrIds) ? linkIdOrIds : [linkIdOrIds];
    if (linkIds.length < 1) {
      return [];
    }
    this.logDatabaseTime('updateLinkText()');
    try {
      const entityManager = (await this.getDataSource(sourceName))!.manager;
      for (const linkId of linkIds) {
        await entityManager.query(`update links
                                   set sources_text = coalesce((select group_concat(words, ' ')
                                                                from (select group_concat(w.normalized_text, '') words
                                                                      from links l
                                                                             join links__source_words j on l.id = j.link_id
                                                                             join words_or_parts w on w.id = j.word_id
                                                                      where l.id = links.id
                                                                        and l.id = :linkId
                                                                        and w.normalized_text is not null
                                                                      group by substr(w.id, 1, 19)
                                                                      order by w.id)), '')
                                   WHERE links.id = :linkId;`, [{ linkId }]);
        await entityManager.query(`update links
                                   set targets_text = coalesce((select group_concat(words, ' ')
                                                                from (select group_concat(w.normalized_text, '') words
                                                                      from links l
                                                                             join links__target_words j on l.id = j.link_id
                                                                             join words_or_parts w on w.id = j.word_id
                                                                      where l.id = links.id
                                                                        and l.id = :linkId
                                                                        and w.normalized_text is not null
                                                                      group by substr(w.id, 1, 19)
                                                                      order by w.id)), '')
                                   WHERE links.id = :linkId;`, [{ linkId }]);
      }
      this.logDatabaseTimeLog('updateLinkText()', sourceName, linkIdOrIds);
      return true;
    } catch (ex) {
      console.error('updateLinkText()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('updateLinkText()');
    }
  };

  updateAllLinkText = async (sourceName: string) => {
    this.logDatabaseTime('updateAllLinkText()');
    try {
      const entityManager = (await this.getDataSource(sourceName))!.manager;
      await entityManager.query(`update links
                                 set sources_text = coalesce((select group_concat(words, ' ')
                                                              from (select group_concat(w.normalized_text, '') words
                                                                    from links l
                                                                           join links__source_words j on l.id = j.link_id
                                                                           join words_or_parts w on w.id = j.word_id
                                                                    where l.id = links.id
                                                                      and w.normalized_text is not null
                                                                    group by substr(w.id, 1, 19)
                                                                    order by w.id)), '');`);
      await entityManager.query(`update links
                                 set targets_text = coalesce((select group_concat(words, ' ')
                                                              from (select group_concat(w.normalized_text, '') words
                                                                    from links l
                                                                           join links__target_words j on l.id = j.link_id
                                                                           join words_or_parts w on w.id = j.word_id
                                                                    where l.id = links.id
                                                                      and w.normalized_text is not null
                                                                    group by substr(w.id, 1, 19)
                                                                    order by w.id)), '');`);
      this.logDatabaseTimeLog('updateAllLinkText()', sourceName);
      return true;
    } catch (ex) {
      console.error('updateAllLinkText()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('updateAllLinkText()');
    }
  };

  findByIds = async <T, >(sourceName: string, table: string, itemIds: string | string[]): Promise<T[]|undefined> => {
    this.logDatabaseTime('findByIds()');
    try {
      const dataSource = (await this.getDataSource(sourceName))!;
      let result: T[];
      switch (table) {
        case LinkTableName:
          result = await this.findLinksById(dataSource, itemIds) as T[];
          break;
        default:
          result = await dataSource
            .getRepository(table)
            .findBy({ id: In(itemIds as string[]) }) as T[];
          break;
      }
      this.logDatabaseTimeLog('findByIds()', sourceName, table, itemIds, result);
      return result;
    } catch (ex) {
      console.error('findByIds()', ex);
      return undefined;
    } finally {
      this.logDatabaseTimeEnd('findByIds()');
    }
  };

  getAll = async (sourceName: string, table: string, itemLimit?: number, itemSkip?: number) => {
    this.logDatabaseTime(`getAll()`);
    try {
      const dataSource = (await this.getDataSource(sourceName))!;
      let result;
      switch (table) {
        case LinkTableName:
          result = await this.getAllLinks(dataSource, itemLimit, itemSkip);
          break;
        default:
          const queryBuilder = dataSource
            .getRepository(table)
            .createQueryBuilder();
          if (itemLimit) queryBuilder.take(itemLimit);
          if (itemSkip) queryBuilder.skip(itemSkip);
          result = (await queryBuilder.getMany())
            .filter(Boolean);
          break;
      }
      this.logDatabaseTimeLog('getAll()', sourceName, table, itemLimit, itemSkip, result.length);
      return result;
    } catch (ex) {
      console.error(`getAll()`, ex);
    } finally {
      this.logDatabaseTimeEnd(`getAll()`);
    }
  };

  findOneById = async<T,> (sourceName: string, table: string, itemId: string) : Promise<T | undefined> => {
    this.logDatabaseTime('findOneById()');
    try {
      const dataSource = (await this.getDataSource(sourceName))!;
      let result: T;
      switch (table) {
        case LinkTableName:
          const links = await this.findLinksById(dataSource, [itemId]);
          result = (links.length > 0 ? links[0] : []) as any as T;
          break;
        default:
          result = (await dataSource
            .getRepository(table)
            .findOneBy({ id: itemId })) as any as T;
          break;
      }
      this.logDatabaseTimeLog('findOneById()', sourceName, table, itemId, result);
      return result;
    } catch (ex) {
      console.error('findOneById()', ex);
    } finally {
      this.logDatabaseTimeEnd('findOneById()');
    }
  };

  deleteByIds = async ({ projectId, table, itemIdOrIds, disableJournaling }: DeleteByIdParams) => {
    this.logDatabaseTime('deleteByIds()');
    try {
      const dataSource = (await this.getDataSource(projectId))!;
      switch (table) {
        case LinkTableName:
          const linkIds = Array.isArray(itemIdOrIds) ? itemIdOrIds : [itemIdOrIds];
          if (!disableJournaling) {
            const pastLinks = await this.findByIds<RepositoryLink>(projectId, table, linkIds);
            await dataSource
              .getRepository(JournalEntryTableName)
              .insert(pastLinks!.map((link): JournalEntryEntity => ({
                id: uuid(),
                linkId: link.id,
                type: JournalEntryType.DELETE,
                date: new Date(),
                body: generateJsonString(mapLinkEntityToServerAlignmentLink(link as RepositoryLink))
              } as JournalEntryEntity)));
          }
          await dataSource
            .getRepository(LinksToSourceWordsName)
            .delete(linkIds);
          await dataSource
            .getRepository(LinksToTargetWordsName)
            .delete(linkIds);
          await dataSource
            .getRepository(LinkTableName)
            .delete(linkIds);
          break;
        case JournalEntryTableName:
          const journalEntryIds = Array.isArray(itemIdOrIds) ? itemIdOrIds : [itemIdOrIds];
          const journalEntryRepository = dataSource?.getRepository<JournalEntryEntity>(JournalEntryTableName);
          const journalEntriesToDelete: JournalEntryEntity[] = [];
          for (const journalEntryId of journalEntryIds) {
            const entry = await journalEntryRepository.findOneById(journalEntryId);
            if (entry) journalEntriesToDelete.push(entry);
          }
          for (const journalEntry of journalEntriesToDelete) {
            switch (journalEntry.type) {
              case JournalEntryType.BULK_INSERT:
                if (journalEntry.bulkInsertFile) this.rmBulkInsertFile(projectId, journalEntry.bulkInsertFile, true);
              /* eslint-disable no-fallthrough */
              default:
                await journalEntryRepository?.delete(journalEntry.id!);
                break;
            }
          }
          break;
        default:
          await dataSource
            .getRepository(table)
            .delete(itemIdOrIds);
          break;
      }
      this.logDatabaseTimeLog('deleteByIds()', projectId, table, itemIdOrIds?.length ?? itemIdOrIds);
      return true;
    } catch (ex) {
      console.error('deleteByIds()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('deleteByIds()');
    }
  };

  findBetweenIds = async (sourceName: string, table: string, fromId: string, toId: string) => {
    this.logDatabaseTime('findBetweenIds()');
    try {
      const dataSource = (await this.getDataSource(sourceName))!;
      let result: any[];
      switch (table) {
        case LinkTableName:
          result = await this.findLinksBetweenIds(dataSource, fromId, toId);
          break;
        default:
          result = await dataSource
            .getRepository(table)
            .createQueryBuilder('item')
            .where('item.id >= :fromId and item.id <= :toId', { fromId, toId })
            .getMany();
          break;
      }
      this.logDatabaseTimeLog('findBetweenIds()', sourceName, table, fromId, toId, result?.length ?? result);
      return result;
    } catch (ex) {
      console.error('findBetweenIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('findBetweenIds()');
    }
  };

  corporaGetPivotWords = async (sourceName: string, side: AlignmentSide, filter: PivotWordFilter, sort: GridSortItem) => {
    const em = (await this.getDataSource(sourceName))!.manager;
    const joins = filter === 'aligned'
      ? `inner join links__${side === 'sources' ? 'source' : 'target'}_words j on w.id = j.word_id inner join links l on l.id = j.link_id`
      : '';
    // If we are viewing aligned pivotWords, then don't count rejected links in the total
    const alignmentFilter = filter === 'aligned' ? `and l.status <> 'rejected'` : '';
    return await em.query(`select normalized_text t, language_id l, count(1) c
                           from words_or_parts w
                             ${joins}
                           where w.side = '${side}' ${alignmentFilter}
                           group by t ${this._buildOrderBy(sort, { frequency: 'c', normalizedText: 't' })};`);
  };

  languageFindByIds = async (sourceName: string, languageIds: string[]) => {
    const em = (await this.getDataSource(sourceName))!.manager;
    return await em.query(`SELECT code, text_direction textDirection, font_family fontFamily
                           from language
                           WHERE code in (${languageIds.map(id => `'${id}'`).join(',')});`);
  };


  languageGetAll = async (sourceName: string) => {
    const em = (await this.getDataSource(sourceName))!.manager;
    return await em.query(`SELECT code, text_direction textDirection, font_family fontFamily
                           from language;`);
  };

  corporaGetAlignedWordsByPivotWord = async (sourceName: string, side: AlignmentSide, normalizedText: string, sort: GridSortItem) => {
    const em = (await this.getDataSource(sourceName))!.manager;
    switch (side) {
      case 'sources':
        const sourceQueryTextWLang = `
          SELECT sw.normalized_text   t,
                 sw.language_id       sl,
                 l.sources_text       st,
                 tw.language_id       tl,
                 l.targets_text       tt,
                 count(DISTINCT l.id) c
          FROM words_or_parts sw
                 INNER JOIN links__source_words lsw
                            ON sw.id = lsw.word_id
                 INNER JOIN links l
                            ON l.id = lsw.link_id
                 INNER JOIN links__target_words ltw
                            ON l.id = ltw.link_id
                 INNER JOIN words_or_parts tw
                            ON tw.id = ltw.word_id
          WHERE sw.normalized_text = :normalizedText
            AND sw.side = 'sources'
            AND l.targets_text <> ''
            AND l.status <> 'rejected'
          GROUP BY l.sources_text, l.targets_text
            ${this._buildOrderBy(sort, {
              frequency: 'c', sourceWordTexts: 'sources_text', targetWordTexts: 'targets_text'
            })};`;
        return await em.query(sourceQueryTextWLang, [{ normalizedText }]);
      case 'targets':
        const targetQueryText = `
          SELECT tw.normalized_text   t,
                 sw.language_id       sl,
                 l.sources_text       st,
                 tw.language_id       tl,
                 l.targets_text       tt,
                 count(DISTINCT l.id) c
          FROM words_or_parts tw
                 INNER JOIN links__target_words ltw
                            ON tw.id = ltw.word_id
                 INNER JOIN links l
                            ON l.id = ltw.link_id
                 INNER JOIN links__source_words lsw
                            ON l.id = lsw.link_id
                 INNER JOIN words_or_parts sw
                            ON sw.id = lsw.word_id
          WHERE tw.normalized_text = :normalizedText
            AND tw.side = 'targets'
            AND l.sources_text <> ''
            AND l.status <> 'rejected'
          GROUP BY l.sources_text, l.targets_text
            ${this._buildOrderBy(sort, { frequency: 'c', sourceWordTexts: 'st', targetWordTexts: 'tt' })};`;
        return await em.query(targetQueryText, [{ normalizedText }]);
    }
  };

  corporaGetLinksByAlignedWord = async (sourceName: string,
                                        sourcesText?: string,
                                        targetsText?: string,
                                        sort?: GridSortItem|null,
                                        excludeRejected?: boolean,
                                        itemLimit?: number,
                                        itemSkip?: number) => {
    if (!sourcesText && !targetsText) return [];
    const dataSource = (await this.getDataSource(sourceName))!;
    const entityManager = dataSource.manager;
    const whereSourceTextClause = !!sourcesText ? 'l.sources_text = ?' : undefined;
    const whereTargetTextClause = !!targetsText ? 'l.targets_text = ?' : undefined;

    const whereClauses = [
      whereSourceTextClause,
      whereTargetTextClause,
      excludeRejected ? `l.status != 'rejected'` : undefined
    ].filter(v => !!v);

    const where = whereClauses && whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const params = [sourcesText, targetsText].filter(v => !!v) as string[];

    const linkIds = (await entityManager.query(`
      SELECT l.id        id,
             ltw.word_id word_id
      FROM links l
             INNER JOIN links__target_words ltw
                        ON ltw.link_id = l.id
      ${where}
      GROUP BY id
        ${this._buildOrderBy(sort, { ref: 'word_id' })}
        ${this._buildPaging(itemLimit, itemSkip)};`, params))
      .map((link: any) => link.id);
    return (await this.findLinksById(dataSource, linkIds));
  };

  findLinkStatusesByAlignedWord = async (sourceName: string,
                                    sourcesText?: string,
                                    targetsText?: string,
                                    excludeRejected?: boolean): Promise<{ status: LinkStatus, count: number }[]> => {
    if (!sourcesText && !targetsText) return [];
    const dataSource = (await this.getDataSource(sourceName))!;
    const entityManager = dataSource.manager;

    const whereSourceTextClause = !!sourcesText ? 'l.sources_text = ?' : undefined;
    const whereTargetTextClause = !!targetsText ? 'l.targets_text = ?' : undefined;

    const whereClauses = [
      whereSourceTextClause,
      whereTargetTextClause,
      excludeRejected ? `l.status != 'rejected'` : undefined
    ].filter(v => !!v);

    const where = whereClauses && whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const params = [sourcesText, targetsText].filter(v => !!v) as string[];

    return (await entityManager.query(`
      SELECT l.status status, count(DISTINCT l.status) count
      FROM links l
      ${where};`, params));
  };

  _buildOrderBy = (sort?: GridSortItem|null, fieldMap?: { [key: string]: string }) => {
    if (!sort || !sort.field || !sort.sort) return '';
    return `ORDER BY ${fieldMap && fieldMap?.[sort.field] ? fieldMap[sort.field] : sort.field} ${sort.sort}`;
  };

  _buildPaging = (itemLimit?: number, itemSkip?: number): string => `${!!itemLimit ? `limit ${itemLimit}` : ''} ${!!itemSkip ? `offset ${itemSkip}` : ''}`;

  getBulkInsertDirPath = (projectId: string, dontMkDirIfMissing = false) => {
    const result = path.join(this.getDataDirectory(), JournalEntryDirectory, projectId);
    if (!dontMkDirIfMissing) {
      fs.mkdirSync(result, { recursive: true });
    }
    return result;
  };

  rmBulkInsertDir = (projectId: string, dontRmIfNotEmpty = false) => {
    this.logDatabaseTime('rmBulkInsertDir()');
    try {
      const bulkInsertDirPath = this.getBulkInsertDirPath(projectId, true);
      if (fs.existsSync(bulkInsertDirPath)
        && (!dontRmIfNotEmpty || fs.readdirSync(bulkInsertDirPath).length === 0)) {
        this.logDatabaseTimeLog('rmBulkInsertDir()', bulkInsertDirPath);
        fs.rmSync(bulkInsertDirPath, { recursive: true, force: true, maxRetries: MaxRmRetries });
      }
    } finally {
      this.logDatabaseTimeEnd('rmBulkInsertDir()');
    }
  };

  getBulkInsertFilePath = (projectId: string, fileName: string, dontMkDirIfMissing = false) => path.join(this.getBulkInsertDirPath(projectId, dontMkDirIfMissing), fileName);

  rmBulkInsertFile = (projectId: string, fileName: string, rmDirIfEmpty = false) => {
    this.logDatabaseTime('rmBulkInsertFile()');
    try {
      const bulkInsertFilePath = this.getBulkInsertFilePath(projectId, fileName, true);
      if (fs.existsSync(bulkInsertFilePath)) {
        this.logDatabaseTimeLog('rmBulkInsertFile()', bulkInsertFilePath);
        fs.rmSync(bulkInsertFilePath, { recursive: true, force: true, maxRetries: MaxRmRetries });
        if (rmDirIfEmpty) {
          this.rmBulkInsertDir(projectId, true);
        }
      }
    } finally {
      this.logDatabaseTimeEnd('rmBulkInsertFile()');
    }
  };

  createBulkInsertJournalEntry = async ({ projectId, links }: CreateBulkJournalEntryParams): Promise<void> => {
    const dataSource = (await this.getDataSource(projectId))!;
    const repo = dataSource.getRepository<JournalEntryEntity>(JournalEntryTableName);
    for (const chunk of _.chunk(links, SERVER_TRANSMISSION_CHUNK_SIZE)) {
      const journalEntry: JournalEntryEntity = {
        id: uuid(),
        linkId: undefined,
        type: JournalEntryType.BULK_INSERT,
        date: new Date(),
        body: undefined
      };
      journalEntry.bulkInsertFile = `bulk_insert_${journalEntry.id}.json`;
      const bulkInsertFilePath = this.getBulkInsertFilePath(projectId, journalEntry.bulkInsertFile);
      fs.writeFileSync(bulkInsertFilePath, generateJsonString(chunk));
      await repo.insert(journalEntry);
    }
  };

  getFirstJournalEntryUploadChunk = async (sourceName: string): Promise<JournalEntryDTO[]> => {
    const dataSource = (await this.getDataSource(sourceName))!;
    const repo = dataSource.getRepository<JournalEntryEntity>(JournalEntryTableName);
    const journalEntries = await repo.find({
      order: {
        date: 'ASC'
      },
      take: SERVER_TRANSMISSION_CHUNK_SIZE
    });
    const firstBulkInsertIndex = journalEntries.findIndex((value) => value.type === JournalEntryType.BULK_INSERT);
    if (firstBulkInsertIndex === -1) { // if there are no bulk inserts, simply return all the entries
      return journalEntries.map((je) => mapJournalEntryEntityToJournalEntryDTO(je as JournalEntry));
    } else if (firstBulkInsertIndex === 0) {
      const bulkEntry = journalEntries[0];
      if (bulkEntry.type !== JournalEntryType.BULK_INSERT) throw new Error(`Expected bulk insert but encountered ${generateJsonString(bulkEntry)}`);
      return [
        this.getJournalEntryDTOFromJournalEntryEntity(sourceName, bulkEntry)
      ];
    }
    return journalEntries.slice(0, firstBulkInsertIndex - 1)
      .map((je) => mapJournalEntryEntityToJournalEntryDTO(je as JournalEntry));
  };

  getCount = async (sourceName: string, tableName: string): Promise<number> => {
    const dataSource = (await this.getDataSource(sourceName))!;
    const repo = dataSource.getRepository(tableName);
    return await repo.count();
  };
}
