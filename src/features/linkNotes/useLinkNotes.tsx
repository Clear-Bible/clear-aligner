import { Link, Word } from '../../structs';
import { useAppDispatch, useAppSelector } from '../../app/index';
import { useUserEmail } from '../../hooks/userInfoHooks';
import { useCallback, useMemo, useState } from 'react';
import { LinkNoteEditorDialog } from './linkNoteEditor';
import { createOrModifyNote, removeNote, toggleTextSegment } from '../../state/alignment.slice';

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
}

export const useLinkNotes = ({
                               token,
                               memberOfLink
}: UseLinkNotesProps): UseLinkNotesState => {

  const dispatch = useAppDispatch();

  const editedLinkNote = useAppSelector((state) => (state.alignment.present.inProgressLink?.metadata.note ?? []).at(0));

  const email = useUserEmail({});

  const [ isEditorOpen, setIsEditorOpen ] = useState<boolean>(false);

  const onOpenEditor = useCallback(() => {
    if (!editedLinkNote) {
      dispatch(toggleTextSegment({ foundRelatedLinks: [ memberOfLink ].filter((v) => !!v), word: token }))
    }
    setIsEditorOpen(true);
  }, [ editedLinkNote, dispatch, memberOfLink, token, setIsEditorOpen ]);

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
          dispatch(createOrModifyNote({
            note: {
              ...n,
              authorEmail: email ?? n.authorEmail
            }
          }));
          setIsEditorOpen(false);
        }}
        onDelete={() => {
          dispatch(removeNote({}));
          setIsEditorOpen(false);
        }}
      />
    );
  }, [ memberOfLink, editedLinkNote, isEditorOpen, setIsEditorOpen, dispatch, email ]);

  return {
    editorDialog,
    onOpenEditor
  };
}
