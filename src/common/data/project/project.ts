import { AlignmentSide, CorpusDTO } from './corpus';
import {
  Corpus,
  CorpusContainer,
  CorpusViewType,
  LanguageInfo,
  TextDirection,
} from '../../../structs';
import { LanguageDTO } from './language';
import { Project } from '../../../state/projects/tableManager';
import { DateTime } from 'luxon';
import { mapWordOrPartDtoToWordOrPart } from './wordsOrParts';

export const ProjectTableName = 'project';

export enum ProjectState {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface ProjectDTO {
  id?: string; // uuid
  name: string;
  members: string[];
  state?: ProjectState;
  corpora: CorpusDTO[];
  updatedAt?: number;
  lastSyncTime?: number | null;
}

export enum ProjectLocation {
  REMOTE = 'REMOTE',
  LOCAL = 'LOCAL',
  SYNCED = 'SYNCED',
}

export class ProjectEntity {
  id?: string; // uuid
  name: string;
  members: string;
  location: ProjectLocation;
  serverState?: ProjectState;
  lastSyncTime?: number | null;
  createdAt?: Date;
  updatedAt?: number;
  serverUpdatedAt?: number;
  lastSyncServerTime?: number | null;
  corpora?: Corpus[];
  constructor() {
    this.name = '';
    this.location = ProjectLocation.LOCAL;
    this.members = '[]';
  }
}

export const mapProjectEntityToProjectDTO = (project: Project): ProjectDTO => ({
  id: project.id,
  name: project.name,
  members: project.members ?? [],
  state: project.state ?? ProjectState.DRAFT,
  corpora: [
    ...(project.targetCorpora?.corpora ?? []),
    ...(project.sourceCorpora?.corpora ?? []),
  ]
    .map(mapCorpusEntityToCorpusDTO)
    .filter(Boolean) as CorpusDTO[],
  lastSyncTime: project.lastSyncTime,
  updatedAt: project.updatedAt,
});

export const mapProjectDtoToProject = (
  projectEntity: ProjectDTO,
  location: ProjectLocation
): Project | undefined => {
  const targetCorpus = (projectEntity.corpora ?? []).find(
    (c) => c.side === AlignmentSide.TARGET
  );
  if (!targetCorpus || !projectEntity.id) return;
  const currentTime = DateTime.now().toMillis();
  return {
    id: projectEntity.id,
    name: projectEntity.name,
    members: projectEntity.members,
    abbreviation: targetCorpus.name,
    fileName: targetCorpus.fileName ?? '',
    languageCode: targetCorpus.language.code,
    textDirection: targetCorpus.language
      .textDirection as unknown as TextDirection,
    location: location,
    state: projectEntity.state,
    updatedAt: projectEntity.updatedAt ?? currentTime,
    lastSyncTime: projectEntity.lastSyncTime ?? 0,
    serverUpdatedAt: projectEntity.updatedAt,
    targetCorpora: CorpusContainer.fromIdAndCorpora(
      AlignmentSide.TARGET,
      (projectEntity.corpora ?? [])
        .map(mapCorpusDTOToCorpusEntity)
        .filter((c) => c.side === AlignmentSide.TARGET) ?? []
    ),
    sourceCorpora: CorpusContainer.fromIdAndCorpora(
      AlignmentSide.SOURCE,
      (projectEntity.corpora ?? [])
        .map(mapCorpusDTOToCorpusEntity)
        .filter((c) => c.side === AlignmentSide.SOURCE) ?? []
    ),
  };
};

export const mapCorpusEntityToCorpusDTO = (
  corpus: Corpus
): CorpusDTO | undefined => {
  return {
    id: corpus.id,
    name: corpus.name,
    side: corpus.side,
    fullName: corpus.fullName,
    fileName: corpus.fileName || '',
    language: mapLanguageEntityToLanguageDTO(corpus.language),
    languageCode: corpus.language.code,
  };
};

export const mapCorpusDTOToCorpusEntity = (dto: CorpusDTO): Corpus => {
  return {
    id: dto.id,
    name: dto.name,
    fullName: dto.fullName,
    language: mapLanguageDTOToLanguageEntity(dto.language),
    side: dto.side,
    words: (dto.words || []).map(mapWordOrPartDtoToWordOrPart),
    wordsByVerse: {},
    wordLocation: new Map(),
    books: {},
    fileName: dto.fileName,
    fullText: '',
    viewType: CorpusViewType.Paragraph,
  };
};

export const mapLanguageDTOToLanguageEntity = (
  dto: LanguageDTO
): LanguageInfo => {
  return {
    code: dto.code,
    textDirection: dto.textDirection as unknown as TextDirection,
    fontFamily: dto.fontFamily,
  };
};

export const mapLanguageEntityToLanguageDTO = (
  entity: LanguageInfo
): LanguageDTO => {
  return {
    code: entity.code,
    textDirection: entity.textDirection,
    fontFamily: entity.fontFamily || '',
  };
};
