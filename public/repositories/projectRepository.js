const { EntitySchema, In } = require('typeorm');
const { BaseRepository } = require('./baseRepository');
const fs = require('fs');
const path = require('path');
const sanitize = require('sanitize-filename');
const { app } = require('electron');
const { chunk } = require('lodash');
const uuid = require('uuid-random');
const LinkTableName = 'links';
const CorporaTableName = 'corpora';
const LanguageTableName = 'language';
const LinksToSourceWordsName = 'links__source_words';
const LinksToTargetWordsName = 'links__target_words';
const DefaultProjectName = 'default';
const ProjectDatabaseDirectory = 'projects';

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

class WordsOrParts {
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
    this.position_part = undefined;
    this.position_word = undefined;
    this.normalized_text = '';
    this.source_verse_bcvid = undefined;
    this.language_id = undefined;
  }
}

class CorporaEntity {
  constructor() {
    this.id = undefined;
    this.language_id = undefined;
    this.side = '';
    this.name = '';
    this.full_name = '';
    this.file_name = '';
    this.words = undefined;
  }
}

class LanguageEntity {
  constructor() {
    this.code = undefined;
    this.text_direction = '';
    this.font_family = '';
  }
}


const corporaSchema = new EntitySchema({
  name: 'corpora', tableName: 'corpora', target: CorporaEntity, columns: {
    id: {
      primary: true, type: 'text', generated: false
    }, side: {
      type: 'text'
    }, name: {
      type: 'text'
    }, full_name: {
      type: 'text'
    }, file_name: {
      type: 'text'
    }, language_id: {
      type: 'text'
    }
  }
});

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

const wordsOrPartsSchema = new EntitySchema({
  name: 'words_or_parts', tableName: 'words_or_parts', target: WordsOrParts, columns: {
    id: {
      primary: true, type: 'text', generated: false
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
    }
  }
});


const languageSchema = new EntitySchema({
  name: 'language', tableName: 'language', target: LanguageEntity, columns: {
    code: {
      primary: true, type: 'text', generated: false
    }, font_family: {
      type: 'text'
    }, text_direction: {
      type: 'text'
    }
  }
});

class ProjectRepository extends BaseRepository {

  constructor() {
    super();
    this.isLoggingTime = true;
    this.dataSources = new Map();
    this.getDataSource = async (sourceName) =>
      await this.getDataSourceWithEntities(sourceName || DefaultProjectName,
        [corporaSchema, linkSchema, wordsOrPartsSchema, linksToSourceWordsSchema, linksToTargetWordsSchema, languageSchema],
        path.join(this.getTemplatesDirectory(), DefaultProjectName === sourceName
          ? 'projects/clear-aligner-default.sqlite'
          : 'clear-aligner-template.sqlite'),
        path.join(this.getDataDirectory(), ProjectDatabaseDirectory));
  }

  convertCorpusToDataSource = (corpus) => ({
    id: corpus.id,
    side: corpus.side,
    name: corpus.name,
    full_name: corpus.fullName,
    file_name: corpus.fileName,
    language_id: corpus.language?.code
  });

  convertDataSourceToCorpus = (corpus) => ({
    id: corpus.id,
    side: corpus.side,
    name: corpus.name,
    fullName: corpus.full_name,
    fileName: corpus.file_name,
    language: {
      code: corpus.language_id
    }
  });
  getDataSources = async () => new Promise((res, err) => {
    const sources = [];
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

  removeTargetWordsOrParts = async (sourceName) => {
    await (await this.getDataSource(sourceName))
      .createQueryBuilder()
      .delete()
      .from(WordsOrParts)
      .where('words_or_parts.side = :side', { side: 'targets' })
      .execute();
  };

  createSourceFromProject = async (project) => {
    try {
      // Creates the data source
      const projectDataSource = await this.getDataSource(project.id);
      // Inserts corpora to the {project.id} data source
      const corpora = [...project.corpora];
      await this.insert(project.id, CorporaTableName, corpora);
      const sources = await projectDataSource.getRepository(CorporaTableName)
        .createQueryBuilder(CorporaTableName)
        .getMany();
      return {
        id: project.id, sources
      };
    } catch (ex) {
      console.error('createSourceFromProject()', ex);
    }
  };

  updateSourceFromProject = async (project) => {
    try {
      const corpora = project.corpora.map(this.convertCorpusToDataSource);
      const dataSource = await this.getDataSource(project.id);
      const corporaRepository = dataSource.getRepository(CorporaTableName);
      await corporaRepository.save(corpora);
      await dataSource.getRepository(LanguageTableName).upsert(project.corpora.filter(c => c.language).map(c => ({
        code: c.language.code, text_direction: c.language.textDirection, font_family: c.language.fontFamily
      })), ['code']);
      const sources = await dataSource.getRepository(CorporaTableName)
        .createQueryBuilder(CorporaTableName)
        .getMany();
      return { id: project.id, sources };
    } catch (err) {
      console.error('updateSourceFromProject()', err);
    }
  };

  getFirstBcvFromSource = async (sourceName) => {
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const firstBcv = await entityManager.query(`select replace(id, 'targets:', '') id
                                                  from words_or_parts
                                                  where side = 'targets'
                                                  order by id asc
                                                  limit 1;`);
      return firstBcv[0];
    } catch (err) {
      console.error('getFirstBcvFromSource()', err);
    }
  };

  hasBcvInSource = async (sourceName, bcvId) => {
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const hasBcv = await entityManager.query(`select count(1) bcv
                                                from words_or_parts
                                                where id like 'targets:${bcvId}%'`);
      return !!hasBcv[0]?.bcv;

    } catch (err) {
      console.error('hasBcvInSource()', err);
    }
  };

  removeSource = async (projectId) => {
    fs.readdir(path.join(this.getDataDirectory(), ProjectDatabaseDirectory), async (err, files) => {
      if (err) {
        console.error('There was an error removing the data source: ', err);
      }
      const sourceFiles = [];
      for (let file of files) {
        if (!(file.endsWith('.sqlite') || file.endsWith('.sqlite-shm') || file.endsWith('.sqlite-wal'))) {
          continue;
        }
        const sourceName = file.slice(app.getName().length + 1);
        if (sourceName.startsWith(projectId)) {
          sourceFiles.push(file);
        }
      }
      for (const sourceFile of sourceFiles) {
        fs.unlink(path.join(this.getDataDirectory(), ProjectDatabaseDirectory, sourceFile), () => null);
      }
    });
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
    return !!wordId1.match(/^[onON]\d/) ? wordId1.substring(1) : wordId1;
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

  insert = async (sourceName, table, itemOrItems, chunkSize) => {
    this.logDatabaseTime('insert()');
    try {
      await (await this.getDataSource(sourceName))
        .transaction(async (entityManager) => {
          const items = Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
          const chunks = chunkSize ? chunk(items, chunkSize) : [items];
          const promises = [];
          for (const chunk of chunks) {
            switch (table) {
              case LinkTableName:
                promises.push(
                  entityManager.getRepository(LinkTableName)
                    .insert(chunk.map(link => ({
                      id: link.id
                    }))),
                  entityManager.getRepository(LinksToSourceWordsName)
                    .insert(this.createLinksToSource(chunk)),
                  entityManager.getRepository(LinksToTargetWordsName)
                    .insert(this.createLinksToTarget(chunk)));
                break;
              case CorporaTableName:
                promises.push(
                  entityManager.getRepository(LanguageTableName)
                    .upsert(chunk.filter(c => c.language).map(c => ({
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
            sourceName, table, itemOrItems?.length ?? itemOrItems,
            chunkSize, chunks?.length, promises?.length);
        });
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
    return this.createLinksFromRows(rows);
  };

  findLinksBetweenIds = async (dataSource, fromLinkId, toLinkId) => {
    if (!fromLinkId || !toLinkId) {
      return [];
    }
    return this.createLinksFromRows((await dataSource.manager.query(`select l.id                                           link_id,
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

  findLinksByBCV = async (sourceName, side, bookNum, chapterNum, verseNum) => {
    if (!bookNum || !chapterNum || !verseNum) {
      return [];
    }
    const workSide = side ?? 'targets'; // default to targets
    const workPart1 = (workSide === 'targets') ? 'target' : 'source';
    const workPart2 = (workPart1 === 'target') ? 'source' : 'target';
    this.logDatabaseTime('findLinksByBCV()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const results = this.createLinksFromRows((await entityManager.query(`select q2.link_id, q2.type, q2.words
                                                                           from (with q1(link_id)
                                                                                          as (select distinct jtq.link_id
                                                                                              from words_or_parts w
                                                                                                       inner join 'links__${workPart1}_words' jtq on jtq.word_id = w.id
                                                                                              where w.side = :workSide
                                                                                                and w.position_book = :bookNum
                                                                                                and w.position_chapter = :chapterNum
                                                                                                and w.position_verse = :verseNum)
                                                                                 select q1.link_id                                     as link_id,
                                                                                        '${workPart1}s'                                as type,
                                                                                        json_group_array(
                                                                                                replace(jt1.word_id, '${workPart1}s:', ''))
                                                                                                filter (where jt1.word_id is not null) as words
                                                                                 from 'links__${workPart1}_words' jt1
                                                                                          inner join q1 on jt1.link_id in (q1.link_id)
                                                                                 group by q1.link_id
                                                                                 union
                                                                                 select q1.link_id                                     as link_id,
                                                                                        '${workPart2}s'                                as type,
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
                                                         w.position_part                   as position,
                                                         w.source_verse_bcvid              as sourceVerse
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

  getAllCorpora = async (sourceName) => {
    this.logDatabaseTime('getAllCorpora()');
    try {
      const entityManager = (await this.getDataSource(sourceName)).manager;
      const results = (await entityManager.query(`select c.id             as id,
                                                         c.name           as name,
                                                         c.full_name      as fullName,
                                                         c.file_name      as fileName,
                                                         c.side           as side,
                                                         l.code           as code,
                                                         l.text_direction as textDirection,
                                                         l.font_family    as fontFamily
                                                  from corpora c
                                                           inner join language l on c.language_id = l.code;`));
      this.logDatabaseTimeLog('getAllCorpora()', sourceName, results?.length ?? results);
      return (results ?? [])
        .filter(Boolean)
        .map(result => ({
          id: result.id,
          name: result.name,
          fileName: result.fileName,
          fullName: result.fullName,
          side: result.side,
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

  getAllLinks = async (dataSource, itemLimit, itemSkip) => this.createLinksFromRows((await dataSource.manager.query(`select l.id                                           link_id,
                                                                                                                            json_group_array(
                                                                                                                                    replace(lsw.word_id, 'sources:', ''))
                                                                                                                                    filter (where lsw.word_id is not null) sources,
                                                                                                                            json_group_array(
                                                                                                                                    replace(ltw.word_id, 'targets:', ''))
                                                                                                                                    filter (where ltw.word_id is not null) targets
                                                                                                                     from links l
                                                                                                                              left join links__source_words lsw on l.id = lsw.link_id
                                                                                                                              left join links__target_words ltw on l.id = ltw.link_id
                                                                                                                     group by l.id
                                                                                                                     order by l.id
                                                                                                                     limit ? offset ?;`, [itemLimit, itemSkip])));

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

  getAll = async (sourceName, table, itemLimit, itemSkip) => {
    if (!itemLimit) {
      return [];
    }
    this.logDatabaseTime(`getAll()`);
    try {
      const dataSource = await this.getDataSource(sourceName);
      let result;
      switch (table) {
        case LinkTableName:
          result = await this.getAllLinks(dataSource, itemLimit, itemSkip);
          break;
        default:
          result = (await dataSource
            .getRepository(table)
            .createQueryBuilder()
            .take(itemLimit)
            .skip(itemSkip ?? 0)
            .getMany())
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
          const linkIds = Array.isArray(itemIdOrIds) ? itemIdOrIds : [itemIdOrIds];
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
            WHERE sw.normalized_text = :normalizedText
              AND sw.side = 'sources'
              AND l.targets_text <> ''
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
            GROUP BY l.sources_text, l.targets_text
                ${this._buildOrderBy(sort, { frequency: 'c', sourceWordTexts: 'st', targetWordTexts: 'tt' })};`;
        return await em.query(targetQueryText, [{ normalizedText }]);
    }
  };

  corporaGetLinksByAlignedWord = async (sourceName, sourcesText, targetsText, sort) => {
    const dataSource = (await this.getDataSource(sourceName));
    const entityManager = dataSource.manager;
    const linkIds = (await entityManager.query(`
        SELECT l.id        id,
               ltw.word_id word_id
        FROM links l
                 INNER JOIN links__target_words ltw
                            ON ltw.link_id = l.id
        WHERE l.sources_text = ?
          AND l.targets_text = ?
        GROUP BY id
            ${this._buildOrderBy(sort, { ref: 'word_id' })};`, [sourcesText, targetsText]))
      .map((link) => link.id);
    return (await this.findLinksById(dataSource, linkIds));
  };

  _buildOrderBy = (sort, fieldMap) => {
    if (!sort || !sort.field || !sort.sort) return '';
    return `ORDER BY ${fieldMap && fieldMap[sort.field] ? fieldMap[sort.field] : sort.field} ${sort.sort}`;
  };
}

module.exports = {
  ProjectRepository
};