import { AlignmentFile, AlignmentRecord } from '../structs/alignmentFile';
import { Link } from '../structs';


const saveAlignmentFile = (links: Link[] | undefined) => {
  if (!links) return;
  // create starting instance
  const alignmentExport: AlignmentFile = {
    type: 'translation',
    meta: {
      creator: 'ClearAligner'
    },
    records: links
      .filter(Boolean)
      .filter(link => link.id)
      .map(
        (link) =>
          ({
            id: link.id,
            source: (link.sources ?? []),
            target: (link.targets ?? [])
          } as AlignmentRecord) ?? []
      )
  };

  // Create alignment file content
  const fileContent = JSON.stringify(
    alignmentExport,
    undefined,
    2
  );

  // Create a Blob from the data
  const blob = new Blob([fileContent], {
    type: 'application/json'
  });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a link element
  const link = document.createElement('a');
  const currentDate = new Date();

  // Set the download attribute and file name
  link.download = `alignment_data_${currentDate.getFullYear()}-${String(
    currentDate.getMonth() + 1
  ).padStart(2, '0')}-${String(currentDate.getDate()).padStart(
    2,
    '0'
  )}T${String(currentDate.getHours()).padStart(2, '0')}_${String(
    currentDate.getMinutes()
  ).padStart(2, '0')}.json`;

  // Set the href attribute to the generated URL
  link.href = url;

  // Append the link to the document
  document.body.appendChild(link);

  // Trigger a click event on the link
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);

  // Revoke the URL to free up resources
  URL.revokeObjectURL(url);
};

export default saveAlignmentFile;
