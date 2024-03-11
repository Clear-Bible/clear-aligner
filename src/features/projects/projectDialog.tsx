import React from 'react';
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
import { Close, DeleteOutline } from '@mui/icons-material';
import ISO6393 from 'utils/iso-639-3.json';
import { VirtualTableLinks } from '../../state/links/tableManager';
import { AppContext } from '../../App';
import { Project } from '../../state/projects/tableManager';
import { v4 as uuidv4 } from 'uuid';
import { AlignmentSide, Corpus, CorpusContainer, CorpusFileFormat } from '../../structs';
import { parseTsv, putVersesInCorpus } from '../../workbench/query';
import BCVWP from '../bcvwp/BCVWPSupport';
import { AppState } from '../../state/databaseManagement';
import { useAppDispatch } from '../../app/index';
import { resetTextSegments } from '../../state/alignment.slice';


enum TextDirection {
  LTR = "Left to Right",
  RTL = "Right to Left"
}

interface ProjectDialogProps {
  open: boolean;
  closeCallback: () => void;
  projectId: string | null;
}

const getInitialProjectState = (): Project => ({
  id: uuidv4(),
  name: "",
  abbreviation: "",
  languageCode: "eng",
  textDirection: "LTR",
  fileName: "",
  linksTable: new VirtualTableLinks()
});

const ProjectDialog: React.FC<ProjectDialogProps> = ({open, closeCallback, projectId}) => {
  const dispatch = useAppDispatch();
  const {appState, setAppState, setCurrentReference} = React.useContext(AppContext);
  const [project, setProject] = React.useState<Project>(getInitialProjectState());
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);
  const [openConfirmDelete, setOpenConfirmDelete] = React.useState(false);
  const [fileContent, setFileContent] = React.useState("");
  const [projectUpdated, setProjectUpdated] = React.useState(false);

  const handleUpdate = React.useCallback((updatedProjectFields: Partial<Project>) => {
    if(!projectUpdated) {
      setProjectUpdated(true);
    }
    setProject(p => ({...p, ...updatedProjectFields}));
  }, [projectUpdated, setProject, setProjectUpdated]);

  const handleClose = React.useCallback(() => {
    setProjectUpdated(false);
    setUploadErrors([]);
    setProject(getInitialProjectState());
    closeCallback();
  }, [closeCallback, setProject]);

  const enableCreate = React.useMemo(() => (
    !uploadErrors.length
    && project.fileName.length
    && project.name.length
    && project.abbreviation.length
    && project.languageCode.length
    && Object.keys(TextDirection).includes(project.textDirection)
    && projectUpdated
  ), [project.abbreviation.length, project.fileName.length, project.languageCode.length, project.name.length, project.textDirection, uploadErrors.length, projectUpdated]);

  const handleSubmit = React.useCallback(async () => {
    const projectToUpdate = {
      ...project,
      id: project.id ?? uuidv4()
    }

    if(fileContent) {
      dispatch(resetTextSegments());
      setCurrentReference(null);
      const refCorpus = {
        id: project.id,
        name: project.abbreviation,
        fullName: project.name,
        language: {
          code: project.languageCode,
          textDirection: project.textDirection.toLowerCase(),
        },
        words: [],
        wordsByVerse: {},
        wordLocation: new Map<string, Set<BCVWP>>(),
        books: {},
      } as Corpus;
      const parsedTsvCorpus = await parseTsv(fileContent, refCorpus, AlignmentSide.TARGET, CorpusFileFormat.TSV_TARGET);
      putVersesInCorpus({...refCorpus, ...parsedTsvCorpus});
      projectToUpdate.targetCorpora = CorpusContainer.fromIdAndCorpora("target", [parsedTsvCorpus]);
    }

    const updatedProject = appState.projects.save(projectToUpdate);
    if(updatedProject) {
      const corpora = (updatedProject.targetCorpora?.corpora || [])[0] as Corpus;
      corpora.name = project.abbreviation;
      corpora.fullName = project.name;
      corpora.language = {
        code: project.languageCode,
        textDirection: project.textDirection.toLowerCase() as TextDirection
      };
      updatedProject.targetCorpora = CorpusContainer.fromIdAndCorpora("target", [corpora]);
      setAppState((as: AppState) => ({...as, currentProject: updatedProject}));
    }
    handleClose();
  }, [project, fileContent, appState.projects, handleClose, dispatch, setCurrentReference, setAppState]);

  const handleDelete = React.useCallback(() => {
    if(projectId) {
      appState.projects.remove(projectId);
      setAppState(as => ({
        ...as,
        currentProject: undefined
      } as AppState));
      setOpenConfirmDelete(false);
      handleClose();
    }
  }, [projectId, appState.projects, setOpenConfirmDelete, handleClose, setAppState]);

  React.useEffect(() => {
    const foundProject = Array.from(appState.projects.getProjects().values()).find(p => p.id === projectId);
    if(foundProject) {
      setProject(foundProject);
    }
  }, [projectId, appState.projects, setProject, project.id]);


  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
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
            <Grid container flexDirection="column" alignItems="center" justifyContent="space-between" sx={{width: 500, height: '100%', minHeight: 500, p: 2}}>
              <FormGroup sx={{width: '100%'}}>
                <FormControl>
                  <Typography variant="subtitle2">Name</Typography>
                  <TextField size="small" sx={{mb: 2}} fullWidth type="text" value={project.name} onChange={({target: {value: name}}) =>
                    handleUpdate({name})} />
                </FormControl>
                <FormControl>
                  <Typography variant="subtitle2">Abbreviation</Typography>
                  <TextField size="small" sx={{mb: 2}} fullWidth type="text" value={project.abbreviation} onChange={({target: {value: abbreviation}}) =>
                    handleUpdate({abbreviation})}
                  />
                </FormControl>
                <FormControl>
                  <Typography variant="subtitle2">Language</Typography>
                  <Autocomplete
                    size="small"
                    fullWidth
                    disablePortal
                    options={["", ...Object.keys(ISO6393).map((key: string) => ISO6393[key as keyof typeof ISO6393])].sort((a,b) => a.localeCompare(b))}
                    ListboxProps={{
                      style: {
                        maxHeight: 250
                      }
                    }}
                    sx={{mb: 2}}
                    value={ISO6393[project.languageCode as keyof typeof ISO6393] || ""}
                    onChange={(_, language) =>
                      handleUpdate({
                        languageCode: Object.keys(ISO6393).find(k => ISO6393[k as keyof typeof ISO6393] === language) ?? ""
                      })}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </FormControl>
                <FormControl>
                  <Typography variant="subtitle2">Text Direction</Typography>
                  <Select size="small" sx={{mb: 2}} fullWidth type="text" value={project.textDirection} onChange={({target: {value: textDirection}}) =>
                    handleUpdate({textDirection: textDirection as string})
                  }>
                    {
                      Object.keys(TextDirection).map(td => (
                        <MenuItem key={td} value={td}>
                          {TextDirection[td as keyof typeof TextDirection]}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>

                <Button variant="contained" component="label" sx={{mt: 2, textTransform: 'none'}}>
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
                           if(file.type !== "text/tab-separated-values") {
                             errorMessages.push("Invalid file type supplied.");
                           }
                           if (!["text", "id"].every(header => content.split('\n')[0].includes(header))) {
                             errorMessages.push("TSV must include 'text' and 'id' headers.");
                           }
                           if (content.split('\n').filter(v => v).length < 2) {
                             errorMessages.push("TSV must include at least one row of data.")
                           }
                           if(errorMessages.length) {
                             setUploadErrors(errorMessages);
                             return;
                           }

                           setUploadErrors([]);
                           handleUpdate({fileName: file.name});
                           setFileContent(content);
                         }}
                  />
                </Button>
                <Typography variant="subtitle2" sx={{mt: 1}} {...(uploadErrors.length ? {color: "error"} : {})}>
                  {uploadErrors.length ? (
                    <>
                      <span style={{display: 'block'}}>The file you have selected is not valid:</span>
                      {uploadErrors.map(error => <span style={{display: 'block'}}>{error}</span>)}
                    </>
                  ) : project.fileName}
                </Typography>
              </FormGroup>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Grid container justifyContent="space-between" sx={{p: 2}}>
              {
                projectId
                  ? <Button variant="text" color="error" sx={{textTransform: 'none'}} onClick={() => setOpenConfirmDelete(true)}
                    startIcon={<DeleteOutline />}
                  >Delete</Button>
                  : <Box />
              }
              <Button variant="contained" onClick={handleSubmit} sx={{textTransform: 'none'}} disabled={!enableCreate}>{projectId ? "Update" : "Create"}</Button>
            </Grid>
          </DialogActions>
      </Dialog>
      <Dialog
        maxWidth="xl"
        open={openConfirmDelete}
        onClose={() => setOpenConfirmDelete(false)}
      >
        <DialogContent sx={{width: 650}}>
          <Grid container justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">Are you sure you want to delete this project?</Typography>
            <Grid item>
              <Grid container>
                <Button variant="text" onClick={() => setOpenConfirmDelete(false)} sx={{textTransform: 'none'}}>Go Back</Button>
                <Button variant="contained" onClick={handleDelete} sx={{ml: 2, textTransform: 'none'}}>Delete</Button>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ProjectDialog;
