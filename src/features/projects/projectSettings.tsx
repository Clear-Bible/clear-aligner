/**
 * This file contains the ProjectDialog component which handles project creation
 * and project editing in the Project Mode of the CA application.
 */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  FormGroup,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { DeleteOutline, FileUpload, Unpublished, UploadFile } from '@mui/icons-material';
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
import { AlignmentSide, CORPORA_TABLE_NAME } from '../../common/data/project/corpus';
import { useDatabase } from '../../hooks/useDatabase';
import UploadAlignmentGroup from '../controlPanel/uploadAlignmentGroup';
import { ADMIN_GROUP, useCurrentUserGroups } from '../../hooks/userInfoHooks';
import { useDeleteRemoteProject } from '../../api/projects/useDeleteRemoteProject';
import { getUserGroups } from '../../server/amplifySetup';

enum ProjectDialogMode {
  CREATE = 'create',
  EDIT = 'update'
}

enum TextDirection {
  LTR = 'L to R',
  RTL = 'R to L'
}

/**
 * props for project settings component
 */
export interface ProjectSettingsProps {
  /**
   * action run when the user requests to close the settings display
   */
  closeCallback: () => void;
  /**
   * project id the settings display is for, null for project creation form
   */
  projectId: string | null;
  /**
   * project names that already exist
   */
  unavailableProjectNames?: string[];
  /**
   * whether the user is signed in
   */
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

/**
 * project settings display
 * @param closeCallback action run when the user requests to close the settings display
 * @param projectId project id the settings display is for, null for project creation form
 * @param isSignedIn whether the user is signed in
 * @param unavailableProjectNames project names that already exist
 */
const ProjectSettings: React.FC<ProjectSettingsProps> = ({
                                                       closeCallback,
                                                       projectId,
                                                       isSignedIn,
                                                       unavailableProjectNames = []
                                                     }: ProjectSettingsProps) => {
  const dispatch = useAppDispatch();
  const { publishProject, dialog: publishDialog } = usePublishProject();
  const { setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext);
  const { projectState, preferences, setProjects, setPreferences, projects } = useContext(AppContext);
  const initialProjectState = useMemo<Project>(() => getInitialProjectState(), []);
  const [project, setProject] = useState<Project>(initialProjectState);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [openConfirmUnpublish, setOpenConfirmUnpublish] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [projectUpdated, setProjectUpdated] = useState(false);
  const { deleteProject } = useDeleteRemoteProject();
  const languageOptions = useMemo(() =>
    ['', ...Object.keys(ISO6393).map((key: string) => ISO6393[key as keyof typeof ISO6393])]
      .sort((a, b) => a.localeCompare(b)), []);
  const dbApi = useDatabase();
  const allowDelete = useMemo(() => projectId !== DefaultProjectId, [projectId]);
  const handleUpdate = useCallback((updatedProjectFields: Partial<Project>) => {
    if (!projectUpdated) {
      setProjectUpdated(true);
    }
    setProject((p: Project) => ({ ...p, ...updatedProjectFields }));
  }, [projectUpdated, setProject]);
  const handleClose = useCallback(() => {
    setFileContent('');
    setProjectUpdated(false);
    setUploadErrors([]);
    setProject(getInitialProjectState());
    closeCallback();
  }, [closeCallback, setProject, setUploadErrors, setFileContent]);

  const invalidProjectName = useMemo(() => {
    return (
      unavailableProjectNames.includes((project.name || '').trim())
      && !projectState.projectTable.getDatabaseStatus().busyInfo.isBusy
    );
  }, [unavailableProjectNames, projectState, project]);

  const enableCreate = useMemo(() => (
    !uploadErrors.length
    && (project.fileName || '').length
    && (project.name || '').length
    && !invalidProjectName
    && (project.abbreviation || '').length
    && (project.languageCode || '').length
    && Object.keys(TextDirection).includes((project.textDirection || '').toUpperCase())
    && projectUpdated
  ), [invalidProjectName, uploadErrors.length, project.fileName, project.name, project.abbreviation, project.languageCode, project.textDirection, projectUpdated]);

  const handleSubmit = useCallback(async (type: ProjectDialogMode, e: any) => {
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
            id: project.targetCorpora?.corpora?.[0]?.id ?? uuidv4(),
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
            updatedSinceSync: 1
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
            await projectState.projectTable?.save?.(projectToUpdate, !!fileContent, false, true);
          } else {
            await projectState.projectTable?.update?.(projectToUpdate, !!fileContent, false, true);
          }
          await dbApi.save({
            projectId: projectToUpdate.id,
            table: CORPORA_TABLE_NAME,
            itemOrItems: targetCorpus,
            disableJournaling: true
          });
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
    , [dbApi, project, fileContent, setPreferences, dispatch, preferences, setProjects, projectId, projectState.projectTable, projectState.userPreferenceTable]);

  const handleDelete = useCallback(async () => {
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
  }, [projectId, projectState.projectTable, projectState.linksTable, setProjects, preferences?.currentProject, handleClose, setPreferences]);

  const setInitialProjectState = useCallback(async () => {
    const foundProject = [...(projects?.values?.() ?? [])].find(p => p.id === projectId);
    if (foundProject) {
      setProject(foundProject as Project);
    }
  }, [projectId, projects, setProject]);

  useEffect(() => {
    setInitialProjectState().catch(console.error);
  }, [setInitialProjectState]);

  const tsvUploadGroup = useMemo<JSX.Element>(() => {
    if (!!projectId) return (<></>);
    return (
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: 'row'
        }}>
        <Box
          sx={(theme) => ({
            marginRight: '6px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            borderStyle: 'dashed',
            borderWidth: '1px',
            borderColor: theme.palette.text.disabled,
            paddingX: '8px',
            flexGrow: 1
          })}>
          <UploadFile sx={{ color: uploadErrors.length ? 'error.main' : 'primary.main', m: 1 }} />
          <Typography variant="subtitle2" sx={{ mt: .5 }} {...(uploadErrors.length ? { color: 'error' } : { color: 'primary' })}>
            {uploadErrors.length ? (
              <>
                {uploadErrors.map(error => <span style={{ display: 'block' }}>{error}</span>)}
              </>
            ) : project.fileName}
          </Typography>
        </Box>
        <Button variant="contained" component="label"
                sx={{
                  borderRadius: 10,
                }}
                disabled={project.location === ProjectLocation.REMOTE}>
          <FileUpload/>
          Upload
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
      </Box>);
  }, [uploadErrors, project.fileName, project.location, handleUpdate, setUploadErrors, setFileContent, projectId]);

  const groups = useCurrentUserGroups({ forceRefresh: true });
  const isAdmin = useMemo<boolean>(() => (groups ?? []).includes(ADMIN_GROUP), [groups]);

  const isFormReadOnly = useMemo<boolean>(() => {
    if (project.location === ProjectLocation.REMOTE) return true;
    if (project.location === ProjectLocation.SYNCED && !isSignedIn) return true;
    return false;
  }, [isSignedIn, project.location]);

  return (
    <>
      <Typography variant={'subtitle1'}
                  sx={{
                    alignSelf: 'start',
                    justifyContent: 'left',
                    mb: '8px',
                    fontWeight: 'bold'
                  }}>{!projectId ? 'Create' : 'Edit'} Project</Typography>
          <Grid container flexDirection="column" alignItems="center" justifyContent="space-between"
                sx={{ width: '100%', height: '100%' }}>
            <FormGroup sx={{
              width: '100%',
            }}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                }}>
                <FormControl
                  sx={{
                    flexGrow: 1
                  }}>
                  <TextField size="small" label={'Name'} sx={{  }} fullWidth type="text" value={project.name}
                             disabled={isFormReadOnly}
                             onChange={({ target: { value: name } }) =>
                               handleUpdate({ name })}
                             error={invalidProjectName}
                             helperText={invalidProjectName ? 'Project name already in use.' : ''}
                  />
                </FormControl>
                <FormControl>
                  <TextField
                            size="small"
                            sx={{
                              ml: '2px',
                              width: '64px'
                            }}
                            label={'Abbrev'}
                            fullWidth
                            type="text"
                            value={project.abbreviation}
                            disabled={isFormReadOnly}
                            onChange={({ target: { value: abbreviation } }) =>
                               handleUpdate({ abbreviation })}
                  />
                </FormControl>
              </Box>
              <Typography
                sx={{
                  ml: '12px',
                  mt: '2px'
                }}
                variant={'caption'}
                color={'text.secondary'}>{project.fileName}</Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  width: '100%',
                  mt: '8px'
                }}>
                <FormControl
                  sx={{
                    width: '90px'
                  }}>
                  <InputLabel id={'direction-label'} shrink>Direction</InputLabel>
                  <Select
                          size="small"
                          label={'Direction'}
                          sx={{
                          }}
                          fullWidth type="text" value={project.textDirection}
                          disabled={isFormReadOnly}
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
                <FormControl
                  sx={{
                    flexGrow: 1,
                    ml: '2px'
                  }}>
                  <Autocomplete
                    sx={{
                    }}
                    size="small"
                    fullWidth
                    disablePortal
                    options={languageOptions}
                    ListboxProps={{
                      style: {
                        maxHeight: 250
                      }
                    }}
                    disabled={isFormReadOnly}
                    value={ISO6393[project.languageCode as keyof typeof ISO6393] || ''}
                    onChange={(_, language) =>
                      handleUpdate({
                        languageCode: Object.keys(ISO6393).find(k => ISO6393[k as keyof typeof ISO6393] === language) ?? ''
                      })}
                    renderInput={(params) => <TextField label={'Language'} {...params} />}
                  />
                </FormControl>
              </Box>

              {!projectId && tsvUploadGroup}
              {
                (projectId && (project.location === ProjectLocation.LOCAL || project.location === ProjectLocation.SYNCED)) &&
                <UploadAlignmentGroup containers={[ project.sourceCorpora, project.targetCorpora ].filter(v => !!v)}
                                      disableProjectButtons={false}
                                      isCurrentProject={projectId === preferences?.currentProject}
                                      isSignedIn={isSignedIn}
                />
              }
            </FormGroup>
          </Grid>
          <Grid container justifyContent="space-between">
            <Grid container alignItems="center" sx={{ width: 'fit-content' }}>
              {
                (projectId && allowDelete && (project.location === ProjectLocation.LOCAL || project.location === ProjectLocation.SYNCED))
                  ? <Button variant="text" color="error" sx={{ textTransform: 'none', mr: 1 }}
                            onClick={() => setOpenConfirmDelete(true)}
                            startIcon={<DeleteOutline />}
                  >Delete Local Project</Button>
                  : <Box />
              }
              {
                (project && allowDelete && project.location === ProjectLocation.SYNCED && isSignedIn && isAdmin)
                  ?
                  <Button
                    variant="text"
                    sx={theme => ({ textTransform: 'none', color: theme.palette.text.secondary })}
                    onClick={() => setOpenConfirmUnpublish(true)}
                    startIcon={<Unpublished />}>Delete From Server</Button>
                  : <Box />
              }
            </Grid>
          </Grid>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignSelf: 'end'
        }}>
        <Button
          onClick={handleClose}>Cancel</Button>
        <Button
          disabled={!enableCreate || projectState.projectTable?.isDatabaseBusy() || isFormReadOnly}
          onClick={e => {
            handleSubmit(projectId ? ProjectDialogMode.EDIT : ProjectDialogMode.CREATE, e).then(() => {
              // handleClose() in the .then() ensures dialog doesn't close prematurely
              handleClose();
            });
          }}
        >{!projectId ? 'Create' : 'Save'}</Button>
      </Box>
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
                <Button variant="text" onClick={() => setOpenConfirmDelete(false)}>
                  Go Back
                </Button>
                <Button variant="contained" onClick={handleDelete} sx={{ ml: 2, borderRadius: 10 }}>Delete</Button>
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
            <Typography variant="subtitle1">Are you sure you want to delete this project?</Typography>
            <Grid item>
              <Grid container>
                <Button variant="text" onClick={() => setOpenConfirmUnpublish(false)}>
                  Go Back
                </Button>
                <Button variant="contained" onClick={() => {
                  getUserGroups(true)
                    .then((groups) => {
                      const isAdmin = (groups ?? [] as string[])?.includes(ADMIN_GROUP);
                      const displayPermissionsErrorMsg = () => {
                        setSnackBarMessage('You do not have permission to complete this operation');
                        setIsSnackBarOpen(true);
                      }
                      if (!isAdmin) {
                        displayPermissionsErrorMsg();
                        setOpenConfirmUnpublish(false);
                        return;
                      }
                      setOpenConfirmUnpublish(false);
                      const initialProjectState = project.state ?? ProjectState.PUBLISHED;
                      publishProject(project, ProjectState.DRAFT)
                        .then(() => {
                          return deleteProject(project.id)
                            .then((response) => {
                              if (!response || response?.success)
                                return;
                              if (response?.response.statusCode === 403) {
                                void publishProject(project, initialProjectState);
                                displayPermissionsErrorMsg();
                              }
                            });
                        });
                    });
                }} sx={{ ml: 2, borderRadius: 10 }}>Delete</Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
      {publishDialog}
    </>
  );
};

export default ProjectSettings;
