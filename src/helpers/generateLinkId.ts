import { Link } from 'structs';

// Generate a new link ID for a given Link[].
const generateLinkId = (links: Link[]): number => {
  try {
    const linkIds = links
      .map((link) => {
        const idTagParsed = /^.*-([0-9]+)$/.exec(link.id ?? '');
        if (idTagParsed) {
          return Number(idTagParsed[1]);
        }
        return null;
      })
      .filter((x): x is number => x !== null);
    const highestId = Math.max(...linkIds);

    if (!Number.isFinite(highestId)) {
      return 0;
    }
    return highestId + 1;
  } catch (error) {
    console.error('Problem encountered: generating new link id.');
    throw error;
  }
};

export default generateLinkId;
