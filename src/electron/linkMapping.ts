import { LinkMetadata } from '../structs';
import { ServerAlignmentLinkDTO } from '../common/data/serverAlignmentLinkDTO';

/**
 * converts a link entity into a server alignment link
 * @param l link entity representation
 * @return {@link ServerAlignmentLink}
 */
export const linkEntityToServerAlignmentLink = (l: {
  id?: string;
  sources: string[];
  targets: string[];
  metadata: LinkMetadata;
}): ServerAlignmentLinkDTO => ({
  id: l.id,
  sources: l.sources,
  targets: l.targets,
  meta: l.metadata,
});

/**
 * converts a {@link ServerAlignmentLinkDTO} to a link entity
 * @param l {@link ServerAlignmentLink}
 */
export const serverAlignmentLinkToLinkEntity = (
  l: ServerAlignmentLinkDTO
): {
  id?: string;
  sources: string[];
  targets: string[];
  metadata: LinkMetadata;
} => ({
  id: l.id,
  sources: l.sources,
  targets: l.targets,
  metadata: l.meta,
});
