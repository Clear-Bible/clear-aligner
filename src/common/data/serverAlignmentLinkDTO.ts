import { LinkMetadata, RepositoryLink } from '../../structs';

export const LINKS_TABLE_NAME = 'links';

export interface ServerLinksDTO {
  links: ServerAlignmentLinkDTO[];
}

/**
 * represents alignment links for communicating with the server
 */
export interface ServerAlignmentLinkDTO {
  id?: string;
  sources: string[];
  targets: string[];
  meta: LinkMetadata;
}

/**
 * converts a link entity into a server alignment link
 * @param l link entity representation
 * @return {@link ServerAlignmentLink}
 */
export const mapLinkEntityToServerAlignmentLink = (l: RepositoryLink): ServerAlignmentLinkDTO => ({
  id: l.id,
  sources: l.sources,
  targets: l.targets,
  meta: l.metadata
});

/**
 * converts a {@link ServerAlignmentLinkDTO} to a link entity
 * @param l {@link ServerAlignmentLink}
 */
export const mapServerAlignmentLinkToLinkEntity = (l: ServerAlignmentLinkDTO): {
  id?: string,
  sources: string[],
  targets: string[],
  metadata: LinkMetadata
} => ({
  id: l.id,
  sources: l.sources,
  targets: l.targets,
  metadata: l.meta
});
