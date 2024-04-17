import { VirtualTable } from '../databaseManagement';
import { AlignmentSide, Corpus, CorpusContainer, Word } from '../../structs';
import { EmptyWordId, LinksTable } from '../links/tableManager';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import _ from 'lodash';
import { DatabaseApi } from '../../hooks/useDatabase';

const dbApi: DatabaseApi = (window as any).databaseApi! as DatabaseApi;

export interface Project {
  id: string;
  name: string;
  abbreviation: string;
  languageCode: string;
  textDirection: string;
  fileName: string;
  linksTable?: LinksTable;
  sourceCorpora?: CorpusContainer;
  targetCorpora?: CorpusContainer;
}

const DatabaseInsertChunkSize = 2_000;
const UIInsertChunkSize = DatabaseInsertChunkSize * 8;

export class ProjectTable extends VirtualTable {
  private projects: Map<string, Project>;

  constructor() {
    super();
    this.projects = new Map();
  }

  save = async (project: Project, updateWordsOrParts: boolean, suppressOnUpdate?: boolean): Promise<Project | undefined> => {
    try {
      if (this.isDatabaseBusy()) return;
      this.incrDatabaseBusyCtr();
      // @ts-ignore
      const createdProject = await window.databaseApi.createSourceFromProject(ProjectTable.convertToDto(project));
      updateWordsOrParts && await this.insertWordsOrParts(project);
      this.projects.set(createdProject.id, createdProject);
      this.decrDatabaseBusyCtr();
      return createdProject?.[0] ? ProjectTable.convertDataSourceToProject(createdProject?.[0]) : undefined;
    } catch (e) {
      console.error('Error creating project: ', e);
      return undefined;
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  remove = async (projectId: string, suppressOnUpdate = false) => {
    try {
      if (this.isDatabaseBusy()) return;
      this.incrDatabaseBusyCtr();
      // @ts-ignore
      await window.databaseApi.removeSource(projectId);
      this.projects.delete(projectId);
      this.decrDatabaseBusyCtr();
    } catch (e) {
      console.error('Error deleting project: ', e);
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  update = async (project: Project, updateWordsOrParts: boolean, suppressOnUpdate = false): Promise<Project | undefined> => {
    try {
      if (this.isDatabaseBusy()) return;
      this.incrDatabaseBusyCtr();
      // @ts-ignore
      const updatedProject = await window.databaseApi.updateSourceFromProject(ProjectTable.convertToDto(project));
      updateWordsOrParts && await this.insertWordsOrParts(project);
      this.projects.set(updatedProject, updatedProject);
      this.decrDatabaseBusyCtr();
      return updatedProject ? ProjectTable.convertDataSourceToProject(updatedProject) : undefined;
    } catch (e) {
      console.error('Error updating project: ', e);
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  insertWordsOrParts = async (project: Project) => {
    this.incrDatabaseBusyCtr();
    const wordsOrParts = [...(project.sourceCorpora?.corpora ?? []), ...(project.targetCorpora?.corpora ?? [])]
      .flatMap(corpus => (corpus.words ?? [])
        .filter((word) => !((word.text ?? '').match(/^\p{P}$/gu)))
        .map((w: Word) => ProjectTable.convertWordToDto(w, corpus)));

    // @ts-ignore
    await window.databaseApi.removeTargetWordsOrParts(project.id).catch(console.error);

    let progressCtr = 0;
    let progressMax = wordsOrParts.length;
    this.setDatabaseBusyInfo({
      userText: `Loading ${wordsOrParts.length.toLocaleString()} words and parts...`,
      progressCtr,
      progressMax
    });
    for (const chunk of _.chunk(wordsOrParts, UIInsertChunkSize)) {
      // @ts-ignore
      await window.databaseApi.insert(project.id, 'words_or_parts', chunk, DatabaseInsertChunkSize).catch(console.error);
      progressCtr += chunk.length;
      this.setDatabaseBusyProgress(progressCtr, progressMax);

      const fromWordTitle = ProjectTable.createWordsOrPartsTitle(chunk[0]);
      const toWordTitle = ProjectTable.createWordsOrPartsTitle(chunk[chunk.length - 1]);
      this.setDatabaseBusyText(chunk.length === progressMax
        ? `Loading ${fromWordTitle} to ${toWordTitle} (${progressCtr.toLocaleString()} words and parts)...`
        : `Loading ${fromWordTitle} to ${toWordTitle} (${progressCtr.toLocaleString()} of ${progressMax.toLocaleString()} words and parts)...`);

    }
    this.setDatabaseBusyText('Finishing project creation...');
    this.decrDatabaseBusyCtr();
  };

  static createWordsOrPartsTitle = (word: { id: string }) => {
    const bcvwp = BCVWP.parseFromString((word.id ?? '').split(':')[1] ?? EmptyWordId);
    return `${bcvwp?.getBookInfo()?.ParaText ?? '???'} ${bcvwp.chapter ?? 1}:${bcvwp.verse ?? 1}`;
  };

  getDataSourcesAsProjects = async (): Promise<Project[] | undefined> => {
    try {
      const projects = await dbApi.getDataSources();
      while (!projects) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return (projects || [])
        .filter(project => project?.corpora?.length)
        .map(ProjectTable.convertDataSourceToProject);
    } catch (ex) {
      console.error('Unable to convert data source to project: ', ex);
      return;
    }
  };

  getProjects = async (requery = false): Promise<Map<string, Project> | undefined> => {
    if (requery) {
      const projects = await this.getDataSourcesAsProjects();
      if (projects) {
        this.projects = new Map<string, Project>(projects.filter(p => p).map(p => [p.id, p]));
      }
    }
    return this.projects;
  };

  hasBcvInSource = async (sourceName: string, bcvId: string) => {
    // @ts-ignore
    return await window.databaseApi.hasBcvInSource(sourceName, bcvId.trim()).catch(console.error);
  };

  static convertDataSourceToProject = (dataSource: { id: string, corpora: Corpus[] }) => {
    const corpora = dataSource?.corpora || [];
    const sourceCorpora = corpora.filter((c: Corpus) => c.side === AlignmentSide.SOURCE);
    const targetCorpus = corpora.filter((c: Corpus) => c.side === AlignmentSide.TARGET)[0];

    return {
      id: dataSource.id,
      name: targetCorpus?.fullName,
      abbreviation: targetCorpus?.name,
      languageCode: targetCorpus?.language.code,
      textDirection: targetCorpus?.language.textDirection,
      fileName: targetCorpus?.fileName ?? '',
      sourceCorpora: CorpusContainer.fromIdAndCorpora(AlignmentSide.SOURCE, sourceCorpora),
      targetCorpora: CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET, [targetCorpus])
    } as Project;
  };

  static convertWordToDto = (word: Word, corpus: Corpus) => {
    const bcv = BCVWP.parseFromString(word.id);
    return ({
      id: `${word.side}:${BCVWP.sanitize(word.id)}`,
      corpus_id: corpus.id,
      text: word.text,
      after: word.after,
      gloss: word.gloss,
      position_book: bcv.book,
      position_chapter: bcv.chapter,
      position_verse: bcv.verse,
      position_word: bcv.word,
      position_part: bcv.part,
      normalized_text: word.normalizedText,
      source_verse_bcvid: word.sourceVerse,
      language_id: corpus.language.code,
      side: word.side
    });
  };

  static convertToDto = (project: Project) => ({
    id: project.id,
    name: project.name,
    corpora: [...(project.sourceCorpora?.corpora || []), ...(project.targetCorpora?.corpora || [])]
  });
}
