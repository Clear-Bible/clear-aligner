const { DataSource, EntitySchema, In } = require('typeorm');
const { ipcMain } = require('electron');
const { ChannelPrefix } = require('./database-shared.js');
const path = require('path');
const fs = require('fs');
const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const sanitize = require('sanitize-filename');

const DbWaitInMs = 1000;
const LinkTableName = 'links';
const LinksToSourceWordsName = 'links__source_words';
const LinksToTargetWordsName = 'links__target_words';

class Link {
  constructor() {
    this.id = undefined;
    this.sources_text = undefined;
    this.targets_text = undefined;
  }
}

class LinkToSourceWord {
  constructor() {
    this.link_id = undefined;
    this.word_id = undefined;
  }
}

class LinkToTargetWord {
  constructor() {
    this.link_id = undefined;
    this.word_id = undefined;
  }
}

class Project {
  constructor() {
    this.id = undefined;
    this.bookStats = [];
  }
}

class User {
  constructor() {
    this.id = undefined;
  }
}

class WordsOrParts {
  constructor() {
    this.id = undefined;
    this.corpusId = undefined;
    this.side = undefined;
    this.text = undefined;
    this.after = undefined;
    this.position = undefined;
  }
}

const linkSchema = new EntitySchema({
  name: LinkTableName, tableName: LinkTableName, target: Link, columns: {
    id: {
      primary: true, type: 'text', generated: false
    }, sources_text: {
      type: 'text'
    }, targets_text: {
      type: 'text'
    }
  }
});

const linksToSourceWordsSchema = new EntitySchema({
  name: LinksToSourceWordsName, tableName: LinksToSourceWordsName, target: LinkToSourceWord, columns: {
    link_id: {
      primary: true, type: 'text', generated: false
    }, word_id: {
      type: 'text'
    }
  }
});

const linksToTargetWordsSchema = new EntitySchema({
  name: LinksToTargetWordsName, tableName: LinksToTargetWordsName, target: LinkToTargetWord, columns: {
    link_id: {
      primary: true, type: 'text', generated: false
    }, word_id: {
      type: 'text'
    }
  }
});

const projectSchema = new EntitySchema({
  name: 'project', tableName: 'project', target: Project, columns: {
    id: {
      primary: true, type: 'text', generated: false
    }, bookStats: {
      type: 'simple-json'
    }
  }
});

const userSchema = new EntitySchema({
  name: 'user', tableName: 'user', target: User, columns: {
    id: {
      primary: true, type: 'text', generated: false
    }
  }
});

const wordsOrPartsSchema = new EntitySchema({
  name: 'user', tableName: 'user', target: User, columns: {
    id: {
      primary: true, type: 'text', generated: false
    }, corpusId: {
      type: 'text'
    }, side: {
      type: 'text'
    }, text: {
      type: 'text'
    }, gloss: {
      type: 'text'
    }, after: {
      type: 'text'
    }, position: {
      type: 'integer'
    }
  }
});

class DataSourceStatus {
  constructor() {
    this.dataSource = undefined;
    this.isLoading = false;
    this.isLoaded = false;
  }
}

class DatabaseAccessMain {

  constructor() {
    this.isLoggingTime = true;
    this.dataSources = new Map();
  }

  logDatabaseTime = (label) => {
    if (this.isLoggingTime) {
      console.time(label);
    }
  };

  logDatabaseTimeLog = (label, ...args) => {
    if (this.isLoggingTime) {
      console.timeLog(label, ...args);
    }
  };

  logDatabaseTimeEnd = (label) => {
    if (this.isLoggingTime) {
      console.timeEnd(label);
    }
  };

  getDataSource = async (sourceName) => {
    const sourceStatus = this.dataSources.get(sourceName) ?? new DataSourceStatus();
    if (sourceStatus.isLoaded) {
      return sourceStatus.dataSource;
    }
    this.logDatabaseTime('getDataSource()');
    try {
      while (sourceStatus.isLoading) {
        await new Promise(resolve => setTimeout(resolve, DbWaitInMs));
      }
      if (sourceStatus.isLoaded) {
        return sourceStatus.dataSource;
      }

      sourceStatus.isLoading = true;
      this.dataSources.set(sourceName, sourceStatus);

      const fileName = `${sanitize(app.getName()).slice(0, 40)}-${sanitize(sourceName).slice(0, 200)}.sqlite`;
      let databaseFile;
      if (isDev) {
        databaseFile = fileName;
      } else {
        const databasePath = app.getPath('userData');
        fs.mkdirSync(databasePath, { recursive: true });
        databaseFile = path.join(databasePath, fileName);
      }
      if (!fs.existsSync(databaseFile)) {
        fs.copyFileSync('sql/clear-aligner-template.sqlite', databaseFile);
      }
      this.logDatabaseTimeLog('getDataSource()', sourceName, databaseFile);
      const newDataSource = new DataSource({
        type: 'better-sqlite3',
        database: databaseFile,
        synchronize: false,
        statementCacheSize: 1000,
        prepareDatabase: (db) => {
          db.pragma('journal_mode = WAL');
          db.pragma('synchronous = normal');
          db.pragma('cache_size = -8000000');
        },
        entities: [linkSchema, projectSchema, userSchema, wordsOrPartsSchema, linksToSourceWordsSchema, linksToTargetWordsSchema]
      });
      await newDataSource.initialize();

      sourceStatus.dataSource = newDataSource;
      sourceStatus.isLoaded = true;

      return sourceStatus.dataSource;
    } catch (ex) {
      console.error('getDataSource()', ex);
    } finally {
      sourceStatus.isLoading = false;
      this.logDatabaseTimeEnd('getDataSource()');
    }
  };

  createDataSource = async (sourceName) => {
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


  sanitizeWordId(wordId) {
    const wordId1 = wordId.trim();
    return !!wordId1.match(/^[onON]\d/)
      ? wordId1.substring(1) : wordId1;
  }


  createLinksToSource = (links) => {
    const result = [];
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
  createLinksToTarget = (links) => {
    const result = [];
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

  insert = async (sourceName, table, itemOrItems) => {
    this.logDatabaseTime('insert()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      switch (table) {
        case LinkTableName:
          const links = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
          await dataSource.getRepository(LinkTableName)
            .insert(links.map(link => ({
              id: link.id
            })));
          await dataSource.getRepository(LinksToSourceWordsName)
            .insert(this.createLinksToSource(links));
          await dataSource.getRepository(LinksToTargetWordsName)
            .insert(this.createLinksToTarget(links));
          break;
        default:
          await dataSource.getRepository(table)
            .insert(itemOrItems);
          break;
      }
      this.logDatabaseTimeLog('insert()', sourceName, table, itemOrItems?.length ?? itemOrItems);
      return true;
    } catch (ex) {
      console.error('insert()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('insert()');
    }
  };

  deleteAll = async (sourceName, table) => {
    this.logDatabaseTime('deleteAll()');
    try {
      const dataSource = await this.getDataSource(sourceName);
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
      this.logDatabaseTimeLog('deleteAll()', sourceName, table);
      return true;
    } catch (ex) {
      console.error('deleteAll()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('deleteAll()');
    }
  };

  save = async (sourceName, table, itemOrItems) => {
    this.logDatabaseTime('save()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      switch (table) {
        case LinkTableName:
          const links = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
          await dataSource.getRepository(LinkTableName)
            .save(links.map(link => ({
              id: link.id
            })));
          await dataSource.getRepository(LinksToSourceWordsName)
            .save(this.createLinksToSource(links));
          await dataSource.getRepository(LinksToTargetWordsName)
            .save(this.createLinksToTarget(links));
          break;
        default:
          await dataSource.getRepository(table)
            .save(itemOrItems);
          break;
      }
      this.logDatabaseTimeLog('save()', sourceName, table);
      return true;
    } catch (ex) {
      console.error('save()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('save()');
    }
  };

  existsById = async (sourceName, table, itemId) => {
    this.logDatabaseTime('existsById()');
    try {
      const result = await (await this.getDataSource(sourceName))
        .getRepository(table)
        .existsBy({ id: itemId });
      this.logDatabaseTimeLog('existsById()', sourceName, table, itemId, result);
      return result;
    } catch (ex) {
      console.error('existsById()', ex);
    } finally {
      this.logDatabaseTimeEnd('existsById()');
    }
  };

  createLinksFromRows = (linkRows) => {
    if (!linkRows || linkRows.length === 0) {
      return [];
    }
    const results = [];
    let currLink = {
      id: undefined, sources: [], targets: []
    };
    linkRows.forEach(linkRow => {
      if (currLink.id && currLink.id !== linkRow.link_id) {
        results.push(currLink);
        currLink = {
          id: undefined, sources: [], targets: []
        };
      }
      currLink.id = linkRow.link_id;
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
      results.push(currLink);
    }
    return results;
  };

  findLinksById = async (dataSource, linkIdOrIds) => {
    if (!linkIdOrIds) {
      return [];
    }
    const linkIds = Array.isArray(linkIdOrIds) ? linkIdOrIds : [linkIdOrIds];
    if (linkIds.length < 1) {
      return [];
    }
    const entityManager = dataSource.manager;
    let rows;
    if (linkIds.length > 1) {
      rows = await entityManager.query(`select q.link_id, q.type, q.words
                                        from (select s.link_id,
                                                     'sources' as                                         type,
                                                     json_group_array(replace(s.word_id, 'sources:', '')) words
                                              from links__source_words s
                                              where s.link_id in (?)
                                              group by s.link_id
                                              union
                                              select t.link_id,
                                                     'targets' as                                         type,
                                                     json_group_array(replace(t.word_id, 'targets:', '')) words
                                              from links__target_words t
                                              where t.link_id in (?)
                                              group by t.link_id) q
                                        order by q.link_id;`, [linkIds]);
    } else {
      const workLinkId = linkIds[0];
      rows = await entityManager.query(`select s.link_id,
                                               'sources' as                                         type,
                                               json_group_array(replace(s.word_id, 'sources:', '')) words
                                        from links__source_words s
                                        where s.link_id = ?
                                        union
                                        select t.link_id,
                                               'targets' as                                         type,
                                               json_group_array(replace(t.word_id, 'targets:', '')) words
                                        from links__target_words t
                                        where t.link_id = ?;`, [workLinkId, workLinkId]);
    }
    return this.createLinksFromRows(rows);
  };

  findLinksBetweenIds = async (dataSource, fromLinkId, toLinkId) => {
    if (!fromLinkId || !toLinkId) {
      return [];
    }
    return this.createLinksFromRows((await dataSource.manager.query(`select q.link_id, q.type, q.words
                                                                     from (select s.link_id,
                                                                                  'sources' as                                         type,
                                                                                  json_group_array(replace(s.word_id, 'sources:', '')) words
                                                                           from links__source_words s
                                                                           where s.link_id >= ?
                                                                             and s.link_id <= ?
                                                                           group by s.link_id
                                                                           union
                                                                           select t.link_id,
                                                                                  'targets' as                                         type,
                                                                                  json_group_array(replace(t.word_id, 'targets:', '')) words
                                                                           from links__target_words t
                                                                           where t.link_id >= ?
                                                                             and t.link_id <= ?
                                                                           group by t.link_id) q
                                                                     order by q.link_id;`, [fromLinkId, toLinkId, fromLinkId, toLinkId])));
  };

  findLinksByWordId = async (sourceName, linkSide, wordId) => {
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
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const results = this.createLinksFromRows((await entityManager.query(`select t1.link_id,
                                                                                  json_group_array(replace(t1.word_id, '${firstTableName}s:', ''))  as '${firstTableName}s',
                                                                                  json_group_array(replace(t2.word_id, '${secondTableName}s:', '')) as '${secondTableName}s'
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

  findLinksByBCV = async (sourceName, linkSide, bookNum, chapterNum, verseNum) => {
    if (!linkSide || !bookNum || !chapterNum || !verseNum) {
      return [];
    }
    this.logDatabaseTime('findLinksByBCV()');
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
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const results = this.createLinksFromRows((await entityManager.query(`select t1.link_id,
                                                                                  json_group_array(replace(t1.word_id, '${firstTableName}s:', ''))  as '${firstTableName}s',
                                                                                  json_group_array(replace(t2.word_id, '${secondTableName}s:', '')) as '${secondTableName}s'
                                                                           from words_or_parts w
                                                                                    inner join 'links__${firstTableName}_words' t1 on w.id = t1.word_id
                                                                                    left join 'links__${secondTableName}_words' t2 on t1.link_id = t2.link_id
                                                                           where w.side = ?
                                                                             and w.position_book = ?
                                                                             and w.position_chapter = ?
                                                                             and w.position_verse = ?
                                                                           group by t1.link_id
                                                                           order by t1.link_id;`, [linkSide, bookNum, chapterNum, verseNum])));
      this.logDatabaseTimeLog('findLinksByBCV()', sourceName, linkSide, bookNum, chapterNum, verseNum, results?.length ?? results);
      return results;
    } catch (ex) {
      console.error('findLinksByBCV()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('findLinksByBCV()');
    }
  };

  findWordsByBCV = async (sourceName, linkSide, bookNum, chapterNum, verseNum) => {
    if (!linkSide || !bookNum || !chapterNum || !verseNum) {
      return [];
    }
    this.logDatabaseTime('findWordsByBCV()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
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

  getAllWordsByCorpus = async (sourceName, linkSide, corpusId, wordLimit, wordSkip) => {
    if (!linkSide || !wordLimit) {
      return [];
    }
    this.logDatabaseTime('getAllWordsByCorpus()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const results = (await entityManager.query(`select replace(w.id, '${linkSide}:', '') as id,
                                                         w.corpus_id                       as corpusId,
                                                         w.side                            as side,
                                                         w.text                            as text,
                                                         w.gloss                           as gloss,
                                                         w.after                           as after,
                                                         w.position_part                   as position
                                                  from words_or_parts w
                                                  where w.side = ?
                                                    and w.corpus_id = ?
                                                  order by w.id
                                                  limit ? offset ?;`, [linkSide, corpusId, wordLimit, wordSkip]));
      this.logDatabaseTimeLog('getAllWordsByCorpus()', sourceName, linkSide, corpusId, wordLimit, wordSkip, results?.length ?? results);
      return results;
    } catch (ex) {
      console.error('getAllWordsByCorpus()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('getAllWordsByCorpus()');
    }
  };

  getAllCorpora = async (sourceName) => {
    this.logDatabaseTime('getAllCorpora()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const results = (await entityManager.query(`select c.id             as id,
                                                         c.name           as name,
                                                         c.full_name      as fullName,
                                                         c.side           as side,
                                                         l.code           as code,
                                                         l.text_direction as textDirection
                                                  from corpora c
                                                           inner join language l on c.language_id = l.code;`));
      this.logDatabaseTimeLog('getAllCorpora()', results?.length ?? results);
      return (results ?? [])
        .filter(Boolean)
        .map(result => ({
          id: result.id, name: result.name, fullName: result.fullName, side: result.side, langauge: {
            code: result.code, textDirection: result.textDirection
          }
        }));
    } catch (ex) {
      console.error('getAllCorpora()', ex);
      return [];
    } finally {
      this.logDatabaseTimeEnd('getAllCorpora()');
    }
  };

  getAllLinks = async (dataSource) => this.createLinksFromRows((await dataSource.manager.query(`
      select s.link_id,
             'sources' as                                         type,
             json_group_array(replace(s.word_id, 'sources:', '')) words
      from links__source_words s
      group by s.link_id
      union
      select t.link_id,
             'targets' as                                         type,
             json_group_array(replace(t.word_id, 'targets:', '')) words
      from links__target_words t
      group by t.link_id;`)));

  updateLinkText = async (sourceName, linkIdOrIds) => {
    if (!linkIdOrIds) {
      return [];
    }
    const linkIds = Array.isArray(linkIdOrIds) ? linkIdOrIds : [linkIdOrIds];
    if (linkIds.length < 1) {
      return [];
    }
    this.logDatabaseTime('updateLinkText()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      await entityManager.query(`update links
                                 set sources_text = coalesce((select group_concat(words, ' ')
                                                              from (select group_concat(w.normalized_text, '') words
                                                                    from links l
                                                                             join links__source_words j on l.id = j.link_id
                                                                             join words_or_parts w on w.id = j.word_id
                                                                    where l.id = links.id
                                                                      and l.id in (?)
                                                                      and w.normalized_text is not null
                                                                    group by w.position_word
                                                                    order by w.id)), '');`, [linkIds]);
      await entityManager.query(`update links
                                 set targets_text = coalesce((select group_concat(words, ' ')
                                                              from (select group_concat(w.normalized_text, '') words
                                                                    from links l
                                                                             join links__target_words j on l.id = j.link_id
                                                                             join words_or_parts w on w.id = j.word_id
                                                                    where l.id = links.id
                                                                      and l.id in (?)
                                                                      and w.normalized_text is not null
                                                                    group by w.position_word
                                                                    order by w.id)), '');`, [linkIds]);
      this.logDatabaseTimeLog('updateLinkText()', sourceName, linkIdOrIds);
      return true;
    } catch (ex) {
      console.error('updateLinkText()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('updateLinkText()');
    }
  };

  updateAllLinkText = async (sourceName) => {
    this.logDatabaseTime('updateAllLinkText()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      await entityManager.query(`update links
                                 set sources_text = coalesce((select group_concat(words, ' ')
                                                              from (select group_concat(w.normalized_text, '') words
                                                                    from links l
                                                                             join links__source_words j on l.id = j.link_id
                                                                             join words_or_parts w on w.id = j.word_id
                                                                    where l.id = links.id
                                                                      and w.normalized_text is not null
                                                                    group by w.position_word
                                                                    order by w.id)), '');`);
      await entityManager.query(`update links
                                 set targets_text = coalesce((select group_concat(words, ' ')
                                                              from (select group_concat(w.normalized_text, '') words
                                                                    from links l
                                                                             join links__target_words j on l.id = j.link_id
                                                                             join words_or_parts w on w.id = j.word_id
                                                                    where l.id = links.id
                                                                      and w.normalized_text is not null
                                                                    group by w.position_word
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

  findByIds = async (sourceName, table, itemIds) => {
    this.logDatabaseTime('findByIds()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      let result;
      switch (table) {
        case LinkTableName:
          result = await this.findLinksById(dataSource, itemIds);
          break;
        default:
          result = await dataSource
            .getRepository(table)
            .findBy({ id: In(itemIds) });
          break;
      }
      this.logDatabaseTimeLog('findByIds()', sourceName, table, itemIds, result);
      return result;
    } catch (ex) {
      console.error('findByIds()', ex);
    } finally {
      this.logDatabaseTimeEnd('findByIds()');
    }
  };

  getAll = async (sourceName, table) => {
    this.logDatabaseTime('getAll()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      let result;
      switch (table) {
        case LinkTableName:
          result = await this.getAllLinks(dataSource);
          break;
        default:
          result = (await dataSource
            .getRepository(table)
            .createQueryBuilder()
            .getMany())
            .filter(Boolean);
          break;
      }
      this.logDatabaseTimeLog('getAll()', sourceName, table, result.length);
      return result;
    } catch (ex) {
      console.error('getAll()', ex);
    } finally {
      this.logDatabaseTimeEnd('getAll()');
    }
  };

  findOneById = async (sourceName, table, itemId) => {
    this.logDatabaseTime('findOneById()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      let result;
      switch (table) {
        case LinkTableName:
          const links = await this.findLinksById(dataSource, [itemId]);
          result = links.length > 0 ? links[0] : [];
          break;
        default:
          result = await dataSource
            .getRepository(table)
            .findOneBy({ id: itemId });
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

  deleteByIds = async (sourceName, table, itemIdOrIds) => {
    this.logDatabaseTime('deleteByIds()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      switch (table) {
        case LinkTableName:
          await dataSource
            .getRepository(LinkTableName)
            .delete(itemIdOrIds);
          await dataSource
            .getRepository(LinksToSourceWordsName)
            .delete(itemIdOrIds);
          await dataSource
            .getRepository(LinksToTargetWordsName)
            .delete(itemIdOrIds);
          break;
        default:
          await dataSource
            .getRepository(table)
            .delete(itemIdOrIds);
          break;
      }
      this.logDatabaseTimeLog('deleteByIds()', sourceName, table, itemIdOrIds?.length ?? itemIdOrIds);
      return true;
    } catch (ex) {
      console.error('deleteByIds()', ex);
      return false;
    } finally {
      this.logDatabaseTimeEnd('deleteByIds()');
    }
  };

  findBetweenIds = async (sourceName, table, fromId, toId) => {
    this.logDatabaseTime('findBetweenIds()');
    try {
      const dataSource = await this.getDataSource(sourceName);
      let result = [];
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

  corporaGetPivotWords = async (sourceName, side, filter, sort) => {
    const em = (await this.getDataSource(sourceName)).manager;
    return await em.query(`select normalized_text t,
                                  language_id     l,
                                  count(1)        c
                           from words_or_parts w
                               ${filter === 'aligned' ? `inner join links__${side === 'sources' ? 'source' : 'target'}_words j
                                    on w.id = j.word_id` : ''}
                           where w.side = '${side}'
                           group by t ${this._buildOrderBy(sort, { frequency: 'c', normalizedText: 't' })};`);
  };

  languageFindByIds = async (sourceName, languageIds) => {
    const em = (await this.getDataSource(sourceName)).manager;
    return await em.query(`SELECT code, text_direction textDirection, font_family fontFamily
                           from language
                           WHERE code in (${languageIds.map(id => `'${id}'`).join(',')});`);
  };


  languageGetAll = async (sourceName) => {
    const em = (await this.getDataSource(sourceName)).manager;
    return await em.query(`SELECT code, text_direction textDirection, font_family fontFamily
                           from language;`);
  };

  corporaGetAlignedWordsByPivotWord = async (sourceName, side, normalizedText, sort) => {
    const em = (await this.getDataSource(sourceName)).manager;
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
            WHERE sw.normalized_text = '${normalizedText}'
              AND sw.side = 'sources'
              AND l.targets_text <> ''
            GROUP BY l.sources_text, l.targets_text
                ${this._buildOrderBy(sort, {
                    frequency: 'c', sourceWordTexts: 'sources_text', targetWordTexts: 'targets_text'
                })};`;
        return await em.query(sourceQueryTextWLang);
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
            WHERE tw.normalized_text = '${normalizedText}'
              AND tw.side = 'targets'
              AND l.sources_text <> ''
            GROUP BY l.sources_text, l.targets_text
                ${this._buildOrderBy(sort, { frequency: 'c', sourceWordTexts: 'st', targetWordTexts: 'tt' })};`;
        return await em.query(targetQueryText);
    }
  };

  corporaGetLinksByAlignedWord = async (sourceName, sourcesText, targetsText, sort) => {
    const em = (await this.getDataSource(sourceName)).manager;
    const linkIds = (await em.query(`
        SELECT id
        FROM links
        WHERE sources_text = '${sourcesText}'
          AND targets_text = '${targetsText}'
            ${this._buildOrderBy(sort)};`))
      .map((link) => link.id);
    const links = [];
    for (const linkId of linkIds) {
      links.push(...(await this.findByIds(sourceName, 'links', linkId)));
    }
    return links;
  };

  _buildOrderBy = (sort, fieldMap) => {
    if (!sort || !sort.field || !sort.sort) return '';
    return `order by ${fieldMap && fieldMap[sort.field] ? fieldMap[sort.field] : sort.field} ${sort.sort}`;
  };
}

const DatabaseAccessMainInstance = new DatabaseAccessMain();

module.exports = {
  setUpIpcMain() {
    try {
      ipcMain.handle(`${ChannelPrefix}:createDataSource`, async (event, ...args) => await DatabaseAccessMainInstance.createDataSource(...args));
      ipcMain.handle(`${ChannelPrefix}:insert`, async (event, ...args) => await DatabaseAccessMainInstance.insert(...args));
      ipcMain.handle(`${ChannelPrefix}:deleteAll`, async (event, ...args) => await DatabaseAccessMainInstance.deleteAll(...args));
      ipcMain.handle(`${ChannelPrefix}:save`, async (event, ...args) => await DatabaseAccessMainInstance.save(...args));
      ipcMain.handle(`${ChannelPrefix}:existsById`, async (event, ...args) => await DatabaseAccessMainInstance.existsById(...args));
      ipcMain.handle(`${ChannelPrefix}:findByIds`, async (event, ...args) => await DatabaseAccessMainInstance.findByIds(...args));
      ipcMain.handle(`${ChannelPrefix}:getAll`, async (event, ...args) => await DatabaseAccessMainInstance.getAll(...args));
      ipcMain.handle(`${ChannelPrefix}:findOneById`, async (event, ...args) => await DatabaseAccessMainInstance.findOneById(...args));
      ipcMain.handle(`${ChannelPrefix}:deleteByIds`, async (event, ...args) => await DatabaseAccessMainInstance.deleteByIds(...args));
      ipcMain.handle(`${ChannelPrefix}:findBetweenIds`, async (event, ...args) => await DatabaseAccessMainInstance.findBetweenIds(...args));
      ipcMain.handle(`${ChannelPrefix}:updateLinkText`, async (event, ...args) => await DatabaseAccessMainInstance.updateLinkText(...args));
      ipcMain.handle(`${ChannelPrefix}:updateAllLinkText`, async (event, ...args) => await DatabaseAccessMainInstance.updateAllLinkText(...args));
      ipcMain.handle(`${ChannelPrefix}:findLinksByWordId`, async (event, ...args) => await DatabaseAccessMainInstance.findLinksByWordId(...args));
      ipcMain.handle(`${ChannelPrefix}:findLinksByBCV`, async (event, ...args) => await DatabaseAccessMainInstance.findLinksByBCV(...args));
      ipcMain.handle(`${ChannelPrefix}:findWordsByBCV`, async (event, ...args) => await DatabaseAccessMainInstance.findWordsByBCV(...args));
      ipcMain.handle(`${ChannelPrefix}:getAllWordsByCorpus`, async (event, ...args) => await DatabaseAccessMainInstance.getAllWordsByCorpus(...args));
      ipcMain.handle(`${ChannelPrefix}:getAllCorpora`, async (event, ...args) => await DatabaseAccessMainInstance.getAllCorpora(...args));
      ipcMain.handle(`${ChannelPrefix}:corporaGetPivotWords`, async (event, ...args) => await DatabaseAccessMainInstance.corporaGetPivotWords(...args));
      ipcMain.handle(`${ChannelPrefix}:languageFindByIds`, async (event, ...args) => await DatabaseAccessMainInstance.languageFindByIds(...args));
      ipcMain.handle(`${ChannelPrefix}:corporaGetAlignedWordsByPivotWord`, async (event, ...args) => await DatabaseAccessMainInstance.corporaGetAlignedWordsByPivotWord(...args));
      ipcMain.handle(`${ChannelPrefix}:languageGetAll`, async (event, ...args) => await DatabaseAccessMainInstance.languageGetAll(...args));
      ipcMain.handle(`${ChannelPrefix}:corporaGetLinksByAlignedWord`, async (event, ...args) => await DatabaseAccessMainInstance.corporaGetLinksByAlignedWord(...args));
    } catch (ex) {
      console.error('ipcMain.handle()', ex);
    }
  }
};