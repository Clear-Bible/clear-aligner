/**
 * This file contains the ProjectTable Class and supporting functions.
 */
import { VirtualTable } from '../databaseManagement';
import { Corpus, CorpusContainer, InsertParams, RepositoryLink, Word } from '../../structs';
import { EmptyWordId, LinksTable } from '../links/tableManager';
import BCVWP from '../../features/bcvwp/BCVWPSupport';
import _ from 'lodash';
import { DatabaseApi } from '../../hooks/useDatabase';
import {
  ProjectEntity,
  ProjectLocation,
  ProjectState,
} from '../../common/data/project/project';
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
  lastSyncTime?: number | null;
  updatedAt?: number;
  serverState?: ProjectState;
  serverUpdatedAt?: number;
  lastSyncServerTime?: number | null;
  location: ProjectLocation;
  state?: ProjectState;
  members?: string[];
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

  save = async (
    project: Project,
    updateWordsOrParts: boolean,
    suppressOnUpdate?: boolean,
    createDataSource?: boolean
  ): Promise<Project | undefined> => {
    try {
      if (this.isDatabaseBusy()) return;
      this.incrDatabaseBusyCtr();
      await this.sync(project);
      if (!!createDataSource || updateWordsOrParts) {
        // @ts-ignore
        const createdProject = await window.databaseApi.createSourceFromProject(
          ProjectTable.convertToDto(project)
        );
        createdProject && this.projects.set(createdProject.id, createdProject);
        updateWordsOrParts && (await this.insertWordsOrParts(project));
        this.decrDatabaseBusyCtr();
        return createdProject
          ? ProjectTable.convertDataSourceToProject(createdProject)
          : undefined;
      }
      this.decrDatabaseBusyCtr();
      return project;
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
      await dbApi.removeSource(projectId);
      await dbApi.projectRemove(projectId);
      this.projects.delete(projectId);
      this.decrDatabaseBusyCtr();
    } catch (e) {
      console.error('Error deleting project: ', e);
      this.decrDatabaseBusyCtr();
    } finally {
      await this._onUpdate(suppressOnUpdate);
    }
  };

  updateLastUpdated = async (
    project: Project,
    lastUpdated?: number,
    suppressOnUpdate = false
  ): Promise<Project | undefined> => {
    project.updatedAt = lastUpdated ?? DateTime.now().toMillis();
    return this.update(project, false, suppressOnUpdate);
  };

  update = async (
    project: Project,
    updateWordsOrParts: boolean,
    suppressOnUpdate = false,
    createDataSource?: boolean
  ): Promise<Project | undefined> => {
    try {
      this.incrDatabaseBusyCtr();

      await this.sync(project).catch(console.error);
      if (!!createDataSource || updateWordsOrParts) {
        if (createDataSource) {
          await dbApi.createDataSource(project.id);
        }
        // @ts-ignore
        const updatedProject = await window.databaseApi.updateSourceFromProject(
          ProjectTable.convertToDto(project)
        );
        updateWordsOrParts &&
          (await this.insertWordsOrParts(project).catch(console.error));
        this.projects.set(project.id, project);
        this.decrDatabaseBusyCtr();
        return updatedProject
          ? {
              ...ProjectTable.convertDataSourceToProject(updatedProject),
              lastSyncTime: project.lastSyncTime,
              updatedAt: project.updatedAt,
              serverUpdatedAt: project.serverUpdatedAt,
            }
          : undefined;
      }
      this.decrDatabaseBusyCtr();
      return project;
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
        members: JSON.stringify(project.members ?? []),
        location: project.location ?? ProjectLocation.LOCAL,
        serverState: project.state,
        lastSyncTime: project.lastSyncTime,
        updatedAt: project.updatedAt,
        // updated at millis on server
        serverUpdatedAt: project.serverUpdatedAt,
        // updated at from last sync
        lastSyncServerTime: project.lastSyncServerTime,
      };
      await dbApi.projectSave(projectEntity);
      return true;
    } catch (e) {
      console.error('Error syncing project: ', e);
      return false;
    } finally {
      this.decrDatabaseBusyCtr();
    }
  };

  insertWordsOrParts = async (project: Project) => {
    try {
      this.incrDatabaseBusyCtr();
      const wordsOrParts = [
        ...(project.sourceCorpora?.corpora ?? []),
        ...(project.targetCorpora?.corpora ?? []),
      ].flatMap((corpus) =>
        (corpus.words ?? []).map((w: Word) =>
          ProjectTable.convertWordToDto(w, corpus)
        )
      );

      // @ts-ignore
      await window.databaseApi
        .removeTargetWordsOrParts(project.id)
        .catch(console.error);

      let progressCtr = 0;
      let progressMax = wordsOrParts.length;
      this.setDatabaseBusyInfo({
        userText: `Loading ${wordsOrParts.length.toLocaleString()} tokens...`,
        progressCtr,
        progressMax,
      });
      for (const chunk of _.chunk(wordsOrParts, DatabaseInsertChunkSize)) {
        await dbApi
          .insert({
            projectId: project.id,
            table: 'words_or_parts',
            itemOrItems: chunk,
            chunkSize: DatabaseInsertChunkSize,
          })
          .catch(console.error);
        progressCtr += chunk.length;
        this.setDatabaseBusyProgress(progressCtr, progressMax);

        const fromWordTitle = ProjectTable.createWordsOrPartsTitle(chunk[0]);
        const toWordTitle = ProjectTable.createWordsOrPartsTitle(
          chunk[chunk.length - 1]
        );
        this.setDatabaseBusyText(
          chunk.length === progressMax
            ? `Loading ${fromWordTitle} to ${toWordTitle} (${progressCtr.toLocaleString()} tokens)...`
            : `Loading ${fromWordTitle} to ${toWordTitle} (${progressCtr.toLocaleString()} of ${progressMax.toLocaleString()} tokens)...`
        );
      }
      this.setDatabaseBusyText('Finishing project creation...');
      this.decrDatabaseBusyCtr();
    } catch (e) {
      console.error('Failed to insert tokens: ', e);
    }
  };

  static createWordsOrPartsTitle = (word: { id: string }) => {
    const bcvwp = BCVWP.parseFromString(
      (word.id ?? '').split(':')[1] ?? EmptyWordId
    );
    return `${bcvwp?.getBookInfo()?.ParaText ?? '???'} ${bcvwp.chapter ?? 1}:${
      bcvwp.verse ?? 1
    }`;
  };

  getDataSourcesAsProjects = async (): Promise<Project[] | undefined> => {
    try {
      const projects = await dbApi.getDataSources();
      while (!projects) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return (projects || [])
        .filter((project) => project?.corpora?.length)
        .map(ProjectTable.convertDataSourceToProject);
    } catch (ex) {
      console.error('Unable to convert data source to project: ', ex);
      return;
    }
  };

  getProjectTableData = async (): Promise<ProjectEntity[]> => {
    try {
      const dbProjects = await dbApi.getProjects();
      return dbProjects ?? [];
    } catch (ex) {
      console.error('Unable to convert data source to project: ', ex);
      return [];
    }
  };

  getProjects = async (
    requery = false
  ): Promise<Map<string, Project> | undefined> => {
    if (requery) {
      const projectEntities = await this.getProjectTableData();
      const dataSources = (await this.getDataSourcesAsProjects()) ?? [];
      for (const src of dataSources) {
        if (!projectEntities.find((entity) => entity.id === src.id)) {
          const project: ProjectEntity = {
            ...src,
            members: JSON.stringify(src.members ?? []),
            location: ProjectLocation.LOCAL,
            serverState: undefined,
            lastSyncServerTime: undefined,
            lastSyncTime: undefined,
          };
          projectEntities.push(await dbApi.projectSave(project));
        }
      }
      this.projects = new Map<string, Project>(
        projectEntities.map((entity) => {
          const p: Project | undefined = dataSources?.find(
            (src) => src.id === entity.id
          );
          const project = {
            ...(p ?? {}),
            ...entity,
            name: entity.name,
            members: JSON.parse(entity.members ?? '[]'),
          } as Project;
          return [entity.id!, project];
        })
      );
    }
    return this.projects;
  };

  hasBcvInSource = async (sourceName: string, bcvId: string) => {
    // @ts-ignore
    return await window.databaseApi
      .hasBcvInSource(sourceName, bcvId.trim())
      .catch(console.error);
  };

  removeLinksMarkedToDelete = async (sourceName: string) => {
    // @ts-ignore
    return await window.databaseApi
      .removeLinksMarkedToDelete(sourceName)
      .catch(console.error);
  };

  markIntersectingLinksForDeletion = async <T>(insertParams: { projectId: string; links: RepositoryLink[]; }) => {
    // @ts-ignore
    return await window.databaseApi
      .markIntersectingLinksForDeletion(insertParams)
      .catch(console.error);
  };

  static convertDataSourceToProject = (dataSource: {
    id: string;
    corpora: Corpus[];
  }) => {
    const corpora = dataSource?.corpora || [];
    const sourceCorpora = corpora.filter(
      (c: Corpus) => c.side === AlignmentSide.SOURCE
    );
    const targetCorpora = corpora.filter(
      (c: Corpus) => c.side === AlignmentSide.TARGET
    );
    const targetCorpus = targetCorpora[0];

    return {
      id: dataSource.id,
      name: targetCorpus?.fullName,
      abbreviation: targetCorpus?.name,
      languageCode: targetCorpus?.language.code,
      textDirection: targetCorpus?.language.textDirection,
      fileName: targetCorpus?.fileName ?? '',
      sourceCorpora: CorpusContainer.fromIdAndCorpora(
        AlignmentSide.SOURCE,
        sourceCorpora
      ),
      targetCorpora: CorpusContainer.fromIdAndCorpora(
        AlignmentSide.TARGET,
        targetCorpora
      ),
    } as Project;
  };

  static convertWordToDto = (word: Word, corpus: Corpus) => {
    const bcv = BCVWP.parseFromString(word.id);
    return {
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
      lemma: word.lemma,
      source_verse_bcvid: word.sourceVerse,
      language_id: corpus.language.code,
      side: word.side,
      exclude: word.exclude,
      required: word.required,
    };
  };

  static convertToDto = (project: Project): ProjectDto => ({
    id: project.id,
    name: project.name,
    corpora: [
      ...(project.sourceCorpora?.corpora || []),
      ...(project.targetCorpora?.corpora || []),
    ],
  });

  static projectHasSourceCorpora = (project: Project): boolean => {
    return (project?.sourceCorpora?.corpora?.length ?? 0) > 0;
  };

  static projectHasTargetCorpora = (project: Project): boolean => {
    return (project?.targetCorpora?.corpora?.length ?? 0) > 0;
  };

  static projectHasAllCorpora = (project: Project): boolean => {
    return (
      ProjectTable.projectHasSourceCorpora(project) &&
      ProjectTable.projectHasTargetCorpora(project)
    );
  };

  static projectHasAnyCorpora = (project: Project): boolean => {
    return (
      ProjectTable.projectHasSourceCorpora(project) ||
      ProjectTable.projectHasTargetCorpora(project)
    );
  };
}
