import {
  Button,
  Dialog,
  DialogContent,
  Divider,
  IconButton, MenuItem, MenuList,
  Popover, TextField,
  Typography
} from '@mui/material';
import { LinkNote } from '../../common/data/project/linkNote';
import React, { useCallback, useEffect, useState } from 'react';
import { Box } from '@mui/system';
import { DeleteOutlined, EditOutlined, MoreVertOutlined, StarOutlined } from '@mui/icons-material';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import uuid from 'uuid-random';
import { useUserEmail } from '../../hooks/userInfoHooks';
import { RemovableTooltip } from '../../components/removableTooltip';

//@ts-ignore
const LinkNoteDisplayButtonView = ({ children }) => {
  return (<Box
  sx={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'right'
  }}>
    {children}
  </Box>);
}

interface LinkNoteEditorProps {
  note?: LinkNote;
  onChange?: (note: LinkNote) => void;
  onCancel: () => void;
  onSave: () => void;
}

const LinkNoteEditor = ({
                          note,
                          onChange,
                          onCancel,
                          onSave
                        }: LinkNoteEditorProps) => {
  return (
      <Box
        sx={{
          height: '100%',
          flexGrow: 1,
          flexDirection: 'column',
          display: 'flex',
          userSelect: 'none'
        }}>
        <Typography>Comment</Typography>
        <TextField
          sx={{
            width: '100%',
            flexGrow: 1
          }}
          multiline
          fullWidth
          autoFocus
          tabIndex={0}
          variant={'outlined'}
          value={note?.note ?? ''}
          onChange={(e) => {
            const updatedNote: LinkNote = {
              ...(note!),
              note: e.currentTarget.value ?? ''
            };
            onChange?.(updatedNote);
          }}
        />
        <LinkNoteDisplayButtonView>
          <Button variant={'text'} onClick={onCancel}>Cancel</Button>
          <Button variant={'text'} onClick={onSave}>Save</Button>
        </LinkNoteDisplayButtonView>
      </Box>
  );
}

interface NoteViewerMenuProps {
  onCreate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NoteViewerMenu = ({ onCreate, onEdit, onDelete }: NoteViewerMenuProps) => {
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
          {onCreate && <MenuItem
            onClick={() => {
              closeMenu();
              onCreate();
            }}>
            <ListItemIcon>
              <StarOutlined/>
            </ListItemIcon>
            <ListItemText>Create</ListItemText>
          </MenuItem>}
          {onEdit && <MenuItem
            onClick={() => {
              closeMenu();
              onEdit();
            }}>
            <ListItemIcon>
              <EditOutlined/>
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>}
          {(onDelete && (onCreate || onEdit)) ? <Divider/> : <></>}
          {onDelete && <MenuItem
            onClick={() => {
              closeMenu();
              onDelete();
            }}>
            <ListItemIcon>
              <DeleteOutlined
                sx={(theme) => ({
                  color: theme.palette.error.main
                })}/>
            </ListItemIcon>
            <ListItemText
              sx={(theme) => ({
                color: theme.palette.error.dark
              })} >Delete</ListItemText>
          </MenuItem>}
        </MenuList>
      </Popover>
    </>
  );
}

interface LinkNoteViewerProps {
  note?: LinkNote;
  onCreate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const LinkNoteViewer = ({
                          note,
                          onCreate,
                          onEdit,
                          onDelete,
                          onClose
}: LinkNoteViewerProps) => {
  return (<Box
    sx={{
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        userSelect: 'none'
      }}>
      <Typography>Comment</Typography>
      <NoteViewerMenu
        onCreate={!note ? onCreate : undefined}
        onEdit={onEdit}
        onDelete={note ? onDelete : undefined} />
    </Box>
    <RemovableTooltip title={`double click to ${!!note ? 'edit' : 'create'}`}>
      <Typography
        onDoubleClick={onEdit}
        sx={{
          flexGrow: 1,
          userSelect: 'none',
          whiteSpace: 'pre-wrap'
        }}
        color={theme => theme.palette.text.disabled}>
        {note?.note}
      </Typography>
    </RemovableTooltip>
    <LinkNoteDisplayButtonView>
      <Button
        variant={'text'}
        onClick={onClose}>Okay</Button>
    </LinkNoteDisplayButtonView>
  </Box>);
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
                                       onSave,
                                       onDelete
}: LinkNoteEditorDialogProps) => {
  const email = useUserEmail({});

  const [ tmpNote, setTmpNote ] = useState<LinkNote>();

  const [ mode, setMode ] = useState<'edit'|'view'>('view');

  useEffect(() => {
    setTmpNote(note);
  }, [ note, setTmpNote ]);

  useEffect(() => {
    setMode('view');
    setTmpNote(note);
  }, [ note, setMode, isOpen ]);

  return (
    <Dialog
      open={!!isOpen}
      onClose={() => onClose?.()}>
      <DialogContent
        sx={{
          minWidth: '400px',
          minHeight: '272px',
          display: 'flex',
          flexDirection: 'column'
        }}>
        {mode === 'edit' ?
          <LinkNoteEditor
            note={tmpNote}
            onChange={setTmpNote}
            onCancel={() => {
              setTmpNote(note);
              setMode('view');
            }}
            onSave={() => {
              if (tmpNote) onSave?.(tmpNote);
              setMode('view');
            }} /> : <></>}
        {mode === 'view' ?
          <LinkNoteViewer
            note={note}
            onCreate={() => {
              setTmpNote({
                id: uuid(),
                authorEmail: email ?? '',
                note: ''
              });
              setMode('edit');
            }}
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
            onDelete={() => {
              onDelete();
              onClose?.();
            }}
            onClose={() => onClose?.()} /> : <></>}
      </DialogContent>
    </Dialog>
  )
}
