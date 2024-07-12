/**
 * This file contains the ProjectTable Class and supporting functions.
 */
import { VirtualTable } from '../databaseManagement';
import { Corpus, CorpusContainer, Word } from '../../structs';
import { DefaultProjectId, EmptyWordId, LinksTable } from '../links/tableManager';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import _ from 'lodash';
import { DatabaseApi } from '../../hooks/useDatabase';
import { ProjectEntity, ProjectLocation, ProjectState } from '../../common/data/project/project';
import { DateTime } from 'luxon';
import { AlignmentSide } from '../../common/data/project/corpus';

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
  lastSyncTime?: number;
  updatedAt?: number;
  location: ProjectLocation;
  state?: ProjectState;
}

export interface ProjectDto {
  id?: string;
  name?: string;
  corpora: Corpus[];
}

const DatabaseInsertChunkSize = 2_000;

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
      await this.sync(project);
      updateWordsOrParts && await this.insertWordsOrParts(project);
      createdProject && this.projects.set(createdProject.id, createdProject);
      this.decrDatabaseBusyCtr();
      return createdProject ? ProjectTable.convertDataSourceToProject(createdProject) : undefined;
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
      // @ts-ignore Remove the local project database.
      await window.databaseApi.removeSource(projectId);
      // @ts-ignore Remove the project from the user database.
      await window.databaseApi.projectRemove(projectId);
      this.projects.delete(projectId);
      this.decrDatabaseBusyCtr();
    } catch (e) {
      console.error('Error deleting project: ', e);
      this.decrDatabaseBusyCtr();
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  updateLastUpdated = async (project: Project, lastUpdated?: number, suppressOnUpdate = false): Promise<Project | undefined> => {
    project.updatedAt = lastUpdated ?? DateTime.now().toMillis();
    return this.update(project, false, suppressOnUpdate);
  };

  update = async (project: Project, updateWordsOrParts: boolean, suppressOnUpdate = false): Promise<Project | undefined> => {
    try {
      if (this.isDatabaseBusy()) return;
      this.incrDatabaseBusyCtr();

      // @ts-ignore
      const updatedProject = await window.databaseApi.updateSourceFromProject(ProjectTable.convertToDto(project));
      await this.sync(project).catch(console.error);
      updateWordsOrParts && await this.insertWordsOrParts(project).catch(console.error);
      this.projects.set(project.id, project);
      this.decrDatabaseBusyCtr();
      return updatedProject ? ProjectTable.convertDataSourceToProject(updatedProject) : undefined;
    } catch (e) {
      console.error('Error updating project: ', e);
    } finally {
      this._onUpdate(suppressOnUpdate).catch(console.error);
    }
  };

  sync = async (project: Project): Promise<boolean> => {
    try {
      this.incrDatabaseBusyCtr();
      const projectEntity: ProjectEntity = {
        id: project.id,
        name: project.name,
        location: project.location ?? ProjectLocation.LOCAL,
        serverState: project.state ?? ProjectState.DRAFT,
        lastSyncTime: project.lastSyncTime,
        updatedAt: project.updatedAt
      };
      // @ts-ignore
      await window.databaseApi.projectSave(projectEntity);
      this.decrDatabaseBusyCtr();
      return true;
    } catch (e) {
      console.error('Error syncing project: ', e);
      return false;
    }
  };

  insertWordsOrParts = async (project: Project) => {
    try {
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
        userText: `Loading ${wordsOrParts.length.toLocaleString()} tokens...`,
        progressCtr,
        progressMax
      });
      for (const chunk of _.chunk(wordsOrParts, DatabaseInsertChunkSize)) {
        // @ts-ignore
        await window.databaseApi.insert({
          projectId: project.id,
          table: 'words_or_parts',
          itemOrItems: chunk,
          chunkSize: DatabaseInsertChunkSize
        }).catch(console.error);
        progressCtr += chunk.length;
        this.setDatabaseBusyProgress(progressCtr, progressMax);

        const fromWordTitle = ProjectTable.createWordsOrPartsTitle(chunk[0]);
        const toWordTitle = ProjectTable.createWordsOrPartsTitle(chunk[chunk.length - 1]);
        this.setDatabaseBusyText(chunk.length === progressMax
          ? `Loading ${fromWordTitle} to ${toWordTitle} (${progressCtr.toLocaleString()} tokens)...`
          : `Loading ${fromWordTitle} to ${toWordTitle} (${progressCtr.toLocaleString()} of ${progressMax.toLocaleString()} tokens)...`);
      }
      this.setDatabaseBusyText('Finishing project creation...');
      this.decrDatabaseBusyCtr();
    } catch (e) {
      console.error("Failed to insert tokens: ", e);
    }
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

  getProjectTableData = async (): Promise<ProjectEntity[]> => {
    try {
      return (await dbApi.getProjects()) ?? [];
    } catch (ex) {
      console.error('Unable to convert data source to project: ', ex);
      return [];
    }
  };

  getProjects = async (requery = false): Promise<Map<string, Project> | undefined> => {
    if (requery) {
      const dataSources = await this.getDataSourcesAsProjects();
      if (dataSources) {
        const projectEntities = await this.getProjectTableData();
        this.projects = new Map<string, Project>(dataSources.filter(p => p?.targetCorpora?.corpora?.length).map(p => {
          const entity = projectEntities.find(e => e.id === p.id);
          return [p.id, {
            ...p,
            ...(entity ?? {}),
            name: p.id === DefaultProjectId ? p.name : entity?.name ?? p.name
          }]
        }));
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
    const targetCorpora = corpora.filter((c: Corpus) => c.side === AlignmentSide.TARGET);
    const targetCorpus = targetCorpora[0];

    return {
      id: dataSource.id,
      name: targetCorpus?.fullName,
      abbreviation: targetCorpus?.name,
      languageCode: targetCorpus?.language.code,
      textDirection: targetCorpus?.language.textDirection,
      fileName: targetCorpus?.fileName ?? '',
      sourceCorpora: CorpusContainer.fromIdAndCorpora(AlignmentSide.SOURCE, sourceCorpora),
      targetCorpora: CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET, targetCorpora)
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

  static convertToDto = (project: Project): ProjectDto => ({
    id: project.id,
    name: project.name,
    corpora: [...(project.sourceCorpora?.corpora || []), ...(project.targetCorpora?.corpora || [])]
  });
}
