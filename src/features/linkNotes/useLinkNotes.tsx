import { Link, Word } from '../../structs';
import { useUserEmail } from '../../hooks/userInfoHooks';
import { useCallback, useContext, useMemo, useState } from 'react';
import { LinkNoteEditorDialog } from './linkNoteEditor';
import { LinkNote } from '../../common/data/project/linkNote';
import { AppContext } from '../../App';

/**
 * props for {@link useLinkNotes}
 */
export interface UseLinkNotesProps {
  token: Word;
  memberOfLink?: Link;
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

export const useLinkNotes = ({
                               token,
                               memberOfLink
}: UseLinkNotesProps): UseLinkNotesState => {

  const { projectState: { linksTable } } = useContext(AppContext);

  const editedLinkNote = useMemo<LinkNote|undefined>(() => memberOfLink?.metadata?.note?.at(0), [ memberOfLink?.metadata?.note ]);

  const email = useUserEmail({});

  const [ isEditorOpen, setIsEditorOpen ] = useState<boolean>(false);

  const onOpenEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, [ setIsEditorOpen ]);

  const removeNote = useCallback(() => {
    if (!memberOfLink || !linksTable) return;
    const remove = async () => {
      await linksTable.save({
        ...memberOfLink,
        metadata: {
          ...memberOfLink.metadata,
          note: []
        }
      });
    };
    void remove();
  }, [ memberOfLink, linksTable ]);

  const createOrModifyNote = useCallback((note: LinkNote) => {
    if (!memberOfLink || !linksTable) return;
    if (!note) {
      removeNote();
      return;
    }
    const save = async () => {
      await linksTable.save({
        ...memberOfLink,
        metadata: {
          ...memberOfLink.metadata,
          note: [ {
            ...note,
            authorEmail: email ?? note.authorEmail
          } ]
        }
      });
    };
    void save();
  }, [ linksTable, email, memberOfLink, removeNote ]);

  const editorDialog = useMemo<JSX.Element>(() => {
    if (!memberOfLink) {
      return (<>
      </>);
    }
    return (
      <LinkNoteEditorDialog
        isOpen={isEditorOpen}
        note={editedLinkNote}
        onClose={() => setIsEditorOpen(false)}
        onSave={(n) => {
          createOrModifyNote({
            ...n,
            authorEmail: email ?? n.authorEmail
          });
          setIsEditorOpen(false);
        }}
        onDelete={() => {
          removeNote();
          setIsEditorOpen(false);
        }}
      />
    );
  }, [ memberOfLink, editedLinkNote, isEditorOpen, setIsEditorOpen, email, createOrModifyNote, removeNote ]);

  return {
    editorDialog,
    onOpenEditor,
    hasNote: !!editedLinkNote,
    isEditorOpen
  };
}
