/**
 * This file contains the ProjectDialog component which handles project creation
 * and project editing in the Project Mode of the CA application.
 */
import React, { useContext, useMemo } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormGroup,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { Close, DeleteOutline, Unpublished } from '@mui/icons-material';
import ISO6393 from 'utils/iso-639-3.json';
import { DefaultProjectId, LinksTable } from '../../state/links/tableManager';
import { Project } from '../../state/projects/tableManager';
import { v4 as uuidv4 } from 'uuid';
import { Corpus, CorpusContainer, CorpusFileFormat } from '../../structs';
import { InitializationStates, parseTsv, putVersesInCorpus } from '../../workbench/query';
import BCVWP from '../bcvwp/BCVWPSupport';
import { useAppDispatch } from '../../app/index';
import { resetTextSegments } from '../../state/alignment.slice';
import { AppContext } from '../../App';
import { UserPreference } from '../../state/preferences/tableManager';
import { DateTime } from 'luxon';
import { ProjectLocation, ProjectState } from '../../common/data/project/project';
import { usePublishProject } from '../../api/projects/usePublishProject';
import { AlignmentSide } from '../../common/data/project/corpus';


enum TextDirection {
  LTR = 'Left to Right',
  RTL = 'Right to Left'
}

interface ProjectDialogProps {
  open: boolean;
  closeCallback: () => void;
  projectId: string | null;
  unavailableProjectNames?: string[];
  isSignedIn: boolean;
}

const getInitialProjectState = (): Project => ({
  id: uuidv4(),
  name: '',
  abbreviation: '',
  languageCode: 'eng',
  textDirection: 'ltr',
  fileName: '',
  linksTable: new LinksTable(),
  location: ProjectLocation.LOCAL
});

const ProjectDialog: React.FC<ProjectDialogProps> = ({ open, closeCallback, projectId, isSignedIn, unavailableProjectNames = [] }) => {
  const dispatch = useAppDispatch();
  const {publishProject, dialog: publishDialog} = usePublishProject();
  const { projectState, preferences, setProjects, setPreferences, projects } = useContext(AppContext);
  const initialProjectState = useMemo<Project>(() => getInitialProjectState(), []);
  const [project, setProject] = React.useState<Project>(initialProjectState);
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [openConfirmUnpublish, setOpenConfirmUnpublish] = React.useState(false);
  const [fileContent, setFileContent] = React.useState('');
  const [projectUpdated, setProjectUpdated] = React.useState(false);
  const languageOptions = useMemo(() =>
    ['', ...Object.keys(ISO6393).map((key: string) => ISO6393[key as keyof typeof ISO6393])]
      .sort((a, b) => a.localeCompare(b)), []);
  const allowDelete = React.useMemo(() => projectId !== DefaultProjectId, [projectId]);
  const handleUpdate = React.useCallback((updatedProjectFields: Partial<Project>) => {
    if (!projectUpdated) {
      setProjectUpdated(true);
    }
    setProject((p: Project) => ({ ...p, ...updatedProjectFields }));
  }, [projectUpdated, setProject]);
  const handleClose = React.useCallback(() => {
    setFileContent('');
    setProjectUpdated(false);
    setUploadErrors([]);
    setProject(getInitialProjectState());
    closeCallback();
  }, [closeCallback, setProject, setUploadErrors, setFileContent]);

  const invalidProjectName = React.useMemo(() => {
    return (
      unavailableProjectNames.includes((project.name || '').trim())
      && !projectState.projectTable.getDatabaseStatus().busyInfo.isBusy
    );
  }, [unavailableProjectNames, projectState, projectId, projects, project]);

  const enableCreate = React.useMemo(() => (
    !uploadErrors.length
    && (project.fileName || '').length
    && (project.name || '').length
    && !invalidProjectName
    && (project.abbreviation || '').length
    && (project.languageCode || '').length
    && Object.keys(TextDirection).includes((project.textDirection || '').toUpperCase())
    && projectUpdated
  ), [invalidProjectName, uploadErrors.length, project.fileName, project.name, project.abbreviation, project.languageCode, project.textDirection, projectUpdated]);

  const handleSubmit = React.useCallback(async (type: 'create'|'update', e: any) => {
      projectState.projectTable?.incrDatabaseBusyCtr();
      while (!projectState.projectTable?.isDatabaseBusy()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      return await new Promise((resolve) => {
        setTimeout(async () => {
          e.preventDefault();
          const projectToUpdate = {
            ...project,
            id: project.id ?? uuidv4()
          };

          const targetCorpus = {
            id: uuidv4(),
            name: project.abbreviation,
            fullName: project.name,
            fileName: project.fileName,
            language: {
              code: project.languageCode,
              textDirection: (project.textDirection || 'ltr')
            },
            words: [],
            wordsByVerse: {},
            wordLocation: new Map<string, Set<BCVWP>>(),
            books: {},
            side: AlignmentSide.TARGET,
          } as Corpus;

          if (fileContent) {
            dispatch(resetTextSegments());
            projectState.userPreferenceTable?.saveOrUpdate?.({ ...(preferences ?? {}), bcv: null } as UserPreference);

            const parsedTsvCorpus = parseTsv(fileContent, targetCorpus, AlignmentSide.TARGET, CorpusFileFormat.TSV_TARGET);
            putVersesInCorpus({ ...targetCorpus, ...parsedTsvCorpus });
            projectToUpdate.targetCorpora = CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET, [parsedTsvCorpus]);
          } else {
            projectToUpdate.targetCorpora = CorpusContainer.fromIdAndCorpora(AlignmentSide.TARGET, [{
              ...targetCorpus,
              id: projectToUpdate.targetCorpora?.corpora?.[0]?.id ?? project.id
            }]);
          }
          projectToUpdate.updatedAt = DateTime.now().toMillis();
          projectState.projectTable?.decrDatabaseBusyCtr();
          if (!projectId) {
            projectToUpdate.lastSyncTime = 0;
            await projectState.projectTable?.save?.(projectToUpdate, !!fileContent);
          } else {
            await projectState.projectTable?.update?.(projectToUpdate, !!fileContent);
          }
          if (type === 'update') {
            setPreferences(p => ({
              ...(p ?? {}) as UserPreference,
              initialized: InitializationStates.UNINITIALIZED
            }));
          }
          const updatedProjects = await projectState.projectTable?.getProjects(true);
          setProjects(p => Array.from(updatedProjects?.values?.() ?? p));
          resolve(undefined);
        }, 1000); // Set to 1000 ms to ensure the load dialog displays prior to parsing the tsv
      });
    }
    , [projectState.projectTable, projectState.userPreferenceTable, project, fileContent, setPreferences, projectId, dispatch, preferences, setProjects]);

  const handleDelete = React.useCallback(async () => {
    if (projectId) {
      await projectState.projectTable?.remove?.(projectId);
      setProjects((ps: Project[]) => (ps || []).filter(p => (p.id || '').trim() !== (projectId || '').trim()));
      if (preferences?.currentProject === projectId) {
        projectState.linksTable.reset().catch(console.error);
        projectState.linksTable.setSourceName(DefaultProjectId);
        setPreferences((p: UserPreference | undefined) => ({
          ...(p ?? {}) as UserPreference,
          currentProject: DefaultProjectId,
          initialized: InitializationStates.UNINITIALIZED
        }));
      }
      setOpenConfirmDelete(false);
      handleClose();
    }
  }, [projectId, projectState.projectTable, setProjects, preferences?.currentProject, handleClose, setPreferences, setOpenConfirmDelete]);

  const setInitialProjectState = React.useCallback(async () => {
    const foundProject = [...(projects?.values?.() ?? [])].find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject as Project);
    }
  }, [projectId, projects, setProject]);

  React.useEffect(() => {
    setInitialProjectState().catch(console.error);
  }, [setInitialProjectState]);


  return (
    <>
      <Dialog
        open={open}
      >
        <DialogTitle>
          <Grid container justifyContent="space-between">
            <Typography variant="h6">
              {`${projectId ? 'Edit' : 'Create'} Project`}
            </Typography>
            <IconButton aria-label="close" onClick={handleClose} size="large">
              <Close sx={{ width: 18, height: 18 }} />
            </IconButton>
          </Grid>
        </DialogTitle>
        <DialogContent>
          <Grid container flexDirection="column" alignItems="center" justifyContent="space-between"
                sx={{ width: 500, height: '100%', minHeight: 500, p: 2 }}>
            <FormGroup sx={{ width: '100%' }}>
              <FormControl>
                <Typography variant="subtitle2">Name</Typography>
                <TextField size="small" sx={{ mb: 2 }} fullWidth type="text" value={project.name}
                           disabled={project.location === ProjectLocation.REMOTE}
                           onChange={({ target: { value: name } }) =>
                             handleUpdate({ name })}
                          error={invalidProjectName}
                         helperText={invalidProjectName ? 'Project name already in use.' : ''}
                />
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2">Abbreviation</Typography>
                <TextField size="small" sx={{ mb: 2 }} fullWidth type="text" value={project.abbreviation}
                           disabled={project.location === ProjectLocation.REMOTE}
                           onChange={({ target: { value: abbreviation } }) =>
                             handleUpdate({ abbreviation })}
                />
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2">Language</Typography>
                <Autocomplete
                  size="small"
                  fullWidth
                  disablePortal
                  options={languageOptions}
                  ListboxProps={{
                    style: {
                      maxHeight: 250
                    }
                  }}
                  sx={{ mb: 2 }}
                  disabled={project.location === ProjectLocation.REMOTE}
                  value={ISO6393[project.languageCode as keyof typeof ISO6393] || ''}
                  onChange={(_, language) =>
                    handleUpdate({
                      languageCode: Object.keys(ISO6393).find(k => ISO6393[k as keyof typeof ISO6393] === language) ?? ''
                    })}
                  renderInput={(params) => <TextField {...params} />}
                />
              </FormControl>
              <FormControl>
                <Typography variant="subtitle2">Text Direction</Typography>
                <Select size="small" sx={{ mb: 2 }} fullWidth type="text" value={project.textDirection}
                        disabled={project.location === ProjectLocation.REMOTE}
                        onChange={({ target: { value: textDirection } }) =>
                          handleUpdate({ textDirection: textDirection as string })
                        }>
                  {
                    Object.keys(TextDirection).map(td => (
                      <MenuItem key={td.toLowerCase()} value={td.toLowerCase()}>
                        {TextDirection[td as keyof typeof TextDirection]}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>

              <Button variant="contained" component="label" sx={{ mt: 2, textTransform: 'none' }} disabled={project.location === ProjectLocation.REMOTE}>
                Upload File
                <input type="file" hidden
                       onClick={(event) => {
                         // this is a fix which allows loading a file of the same path and filename. Otherwise the onChange
                         // event isn't thrown.

                         // @ts-ignore
                         event.currentTarget.value = null;
                       }}
                       onChange={async (event) => {
                         // grab file content
                         const file = event!.target!.files![0];
                         const content = await file.text();
                         const errorMessages: string[] = [];
                         const contentLines = content.split('\n');
                         if (!['text', 'id'].every(header => contentLines[0].includes(header))) {
                           errorMessages.push('TSV must include \'text\' and \'id\' headers.');
                         }
                         let goodCtr = 0;
                         for (const contentLine of contentLines) {
                           goodCtr += !!contentLine ? 1 : 0;
                           if (goodCtr > 1) {
                             break;
                           }
                         }
                         if (goodCtr < 2) {
                           errorMessages.push('TSV must include at least one row of data.');
                         }
                         if (errorMessages.length) {
                           setUploadErrors(errorMessages);
                           return;
                         }

                         setUploadErrors([]);
                         handleUpdate({ fileName: file.name });
                         setFileContent(content);
                       }}
                />
              </Button>
              <Typography variant="subtitle2" sx={{ mt: 1 }} {...(uploadErrors.length ? { color: 'error' } : {})}>
                {uploadErrors.length ? (
                  <>
                    <span style={{ display: 'block' }}>The file you have selected is not valid:</span>
                    {uploadErrors.map(error => <span style={{ display: 'block' }}>{error}</span>)}
                  </>
                ) : project.fileName}
              </Typography>
            </FormGroup>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Grid container justifyContent="space-between" sx={{ p: 2 }}>
            <Grid container alignItems="center" sx={{width: 'fit-content'}}>
              {
                (projectId && allowDelete)
                  ? <Button variant="text" color="error" sx={{ textTransform: 'none', mr: 1 }}
                            onClick={() => setOpenConfirmDelete(true)}
                            startIcon={<DeleteOutline />}
                  >Delete</Button>
                  : <Box />
              }
              {
                (project && allowDelete && project.location === ProjectLocation.SYNCED && isSignedIn)
                  ? <Button variant="text" sx={theme => ({ textTransform: 'none', color: theme.palette.text.secondary })}
                            onClick={() => setOpenConfirmUnpublish(true)}
                            startIcon={<Unpublished />}
                  >Unpublish</Button>
                  : <Box />
              }
            </Grid>
            <Button
              variant="contained"
              sx={{ textTransform: 'none' }}
              disabled={!enableCreate || projectState.projectTable?.isDatabaseBusy() || project.location === ProjectLocation.REMOTE}
              onClick={e => {
                handleSubmit(projectId ? 'update' : 'create', e).then(() => {
                  // handleClose() in the .then() ensures dialog doesn't close prematurely
                  handleClose();
                });
              }}
            >
              {projectId ? 'Update' : 'Create'}
            </Button>
          </Grid>
        </DialogActions>
      </Dialog>
      <Dialog
        maxWidth="xl"
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
      >
        <DialogContent sx={{ width: 650 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Are you sure you want to delete this project?</Typography>
            <Grid item>
              <Grid container>
                <Button variant="text" onClick={() => setOpenConfirmDelete(false)} sx={{ textTransform: 'none' }}>
                  Go Back
                </Button>
                <Button variant="contained" onClick={handleDelete} sx={{ ml: 2, textTransform: 'none' }}>Delete</Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog
        maxWidth="xl"
        open={openConfirmUnpublish}
        onClose={() => setOpenConfirmUnpublish(false)}
      >
        <DialogContent sx={{ width: 650 }}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Are you sure you want to unpublish this project?</Typography>
            <Grid item>
              <Grid container>
                <Button variant="text" onClick={() => setOpenConfirmUnpublish(false)} sx={{ textTransform: 'none' }}>
                  Go Back
                </Button>
                <Button variant="contained" onClick={() => {
                  setOpenConfirmUnpublish(false);
                  publishProject(project, ProjectState.DRAFT).then(() => handleClose());
                }} sx={{ ml: 2, textTransform: 'none' }}>Unpublish</Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      {publishDialog}
    </>
  );
};

export default ProjectDialog;
