import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton, MenuItem, MenuList,
  Popover, TextField,
  Typography
} from '@mui/material';
import { LinkNote } from '../../common/data/project/linkNote';
import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/system';
import { DeleteOutlined, EditOutlined, MoreVertOutlined } from '@mui/icons-material';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import uuid from 'uuid-random';
import { useUserEmail } from '../../hooks/userInfoHooks';

interface LinkNoteEditorProps {
  note?: LinkNote;
  onChange?: (note: LinkNote) => void;
  onCancel: () => void;
  onSave: () => void;
}

const LinkNoteEditor = ({
                          note,
                          onChange
                        }: LinkNoteEditorProps) => {
  return (
    <>
      <Typography>CommentEditor</Typography>
      <TextField
        sx={{
          width: '100%',
          height: '100%'
        }}
        value={note?.note ?? ''}
        onChange={(e) => {
          const updatedNote: LinkNote = {
            ...(note!),
            note: e.currentTarget.value ?? ''
          };
          onChange?.(updatedNote);
        }}
        multiline/>
    </>
  );
}

interface NoteViewerMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const NoteViewerMenu = ({ onEdit, onDelete }: NoteViewerMenuProps) => {
  const [ isMenuOpen, setIsMenuOpen ] = useState(false);
  const [ menuRef, setMenuRef ] = useState<Element>();
  const closeMenu = useCallback(() => setIsMenuOpen(false), [ setIsMenuOpen ]);

  return (
    <>
      <IconButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuRef(e.currentTarget);
          setIsMenuOpen(!isMenuOpen);
        }}>
        <MoreVertOutlined
          sx={(theme) => ({
            fill: theme.palette.text.secondary
          })}/>
      </IconButton>
      <Popover
        anchorEl={menuRef}
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}>
        <MenuList>
          <MenuItem
            onClick={() => {
              closeMenu();
              onEdit();
            }}>
            <ListItemIcon>
              <EditOutlined/>
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              closeMenu();
              onDelete();
            }}>
            <ListItemIcon>
              <DeleteOutlined/>
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}

interface LinkNoteViewerProps {
  note?: LinkNote;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const LinkNoteViewer = ({
                          note,
                          onEdit,
                          onDelete,
                          onClose
}: LinkNoteViewerProps) => {
  return (<>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}>
      <Typography>Comment</Typography>
      <NoteViewerMenu onEdit={onEdit} onDelete={onDelete} />
    </Box>
    <Typography color={theme => theme.palette.text.disabled}>{note?.note}</Typography>
    <Button onClick={onClose}>Okay</Button>
  </>);
}

export interface LinkNoteEditorDialogProps {
  isOpen?: boolean;
  note?: LinkNote;
  onDelete: () => void;
  onClose?: () => void;
  onSave?: (note: LinkNote) => void;
}

export const LinkNoteEditorDialog = ({
                                       isOpen,
                                       note,
                                       onClose,
                                       onSave
}: LinkNoteEditorDialogProps) => {
  const email = useUserEmail({});

  const [ tmpNote, setTmpNote ] = useState<LinkNote>();

  const [ mode, setMode ] = useState<'edit'|'view'>('view');

  useEffect(() => {
    setTmpNote(note);
  }, [ note, setTmpNote ]);

  useEffect(() => {
    setMode('view');
  }, [ setMode ]);

  return (
    <Dialog
      open={!!isOpen}
      onClose={() => onClose?.()}>
      { /*<DialogTitle>Comment</DialogTitle>*/ }
      <DialogContent
        sx={{
          minWidth: '400px',
          minHeight: '272px'
        }}>
        {mode === 'edit' ?
          <LinkNoteEditor
            note={tmpNote}
            onChange={setTmpNote}
            onCancel={() => setMode('view')}
            onSave={() => {
              if (tmpNote) onSave?.(tmpNote);
              setMode('view');
            }} /> : <></>}
        {mode === 'view' ?
          <LinkNoteViewer
            note={tmpNote}
            onEdit={() => {
              if (!tmpNote) {
                setTmpNote({
                  id: uuid(),
                  authorEmail: email ?? '',
                  note: ''
                });
              }
              setMode('edit');
            }}
            onDelete={() => {/* TODO: DELETE */}}
            onClose={() => onClose?.()} /> : <></>}
      </DialogContent>
    </Dialog>
  )
}
