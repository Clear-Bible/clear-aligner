import { RepositoryLink } from '../../structs';
import { useUserEmail } from '../../hooks/userInfoHooks';
import { useCallback, useMemo, useState } from 'react';
import { LinkNoteEditorDialog } from './linkNoteEditor';
import { LinkNote } from '../../common/data/project/linkNote';
import { useSaveLink } from '../../state/links/tableManager';

/**
 * props for {@link useLinkNotes}
 */
export interface UseLinkNotesProps {
  memberOfLink?: RepositoryLink;
}

/**
 * return of the {@link useLinkNotes} hook
 */
export interface UseLinkNotesState {
  editorDialog: JSX.Element;
  onOpenEditor: () => void;
  isEditorOpen: boolean;
  hasNote: boolean;
}

export const useLinkNotes = ({ memberOfLink }: UseLinkNotesProps): UseLinkNotesState => {

  const editedLinkNote = useMemo<LinkNote|undefined>(() => memberOfLink?.metadata?.note?.at(0), [ memberOfLink?.metadata?.note ]);

  const email = useUserEmail({});

  const [ isEditorOpen, setIsEditorOpen ] = useState<boolean>(false);

  const { saveLink } = useSaveLink();

  const onOpenEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, [ setIsEditorOpen ]);

  const removeNote = useCallback(() => {
    if (!memberOfLink || !saveLink) return;
    saveLink({
      ...memberOfLink,
      metadata: {
        ...memberOfLink.metadata,
        note: []
      }
    });
  }, [ memberOfLink, saveLink ]);

  const createOrModifyNote = useCallback((note: LinkNote) => {
    if (!memberOfLink || !saveLink) return;
    if (!note) {
      removeNote();
      return;
    }
    saveLink({
      ...memberOfLink,
      metadata: {
        ...memberOfLink.metadata,
        note: [{
          ...note,
          authorEmail: email ?? note.authorEmail
        }]
      }
    });
  }, [ saveLink, email, memberOfLink, removeNote ]);

  const editorDialog = useMemo<JSX.Element>(() => {
    if (!memberOfLink || !isEditorOpen) {
      return (<>
      </>);
    }
    return (
      <LinkNoteEditorDialog
        isOpen={isEditorOpen}
        note={editedLinkNote}
        onClose={() => setIsEditorOpen(false)}
        onSave={(n) => {
          if (n.note) {
            createOrModifyNote(n);
          } else {
            removeNote();
          }
          setIsEditorOpen(false);
        }}
        onDelete={() => {
          removeNote();
          setIsEditorOpen(false);
        }}
      />
    );
  }, [ memberOfLink, editedLinkNote, isEditorOpen, setIsEditorOpen, createOrModifyNote, removeNote ]);

  return {
    editorDialog,
    onOpenEditor,
    hasNote: !!editedLinkNote,
    isEditorOpen
  };
}
