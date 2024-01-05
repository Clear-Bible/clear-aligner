import { useState } from 'react';
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
} from '@mui/material';

import useDebug from 'hooks/useDebug';
import { useAppDispatch } from 'app/hooks';
import { changeCorpusViewport } from 'state/app.slice';
import { Corpus } from '../../structs';

interface CorpusSettingsProps {
  currentCorpusId: string | null;
  viewportIndex: number;
  corpora: Corpus[];
}

const CorpusSettingsComponent = (props: CorpusSettingsProps) => {
  useDebug('CorpusSettings');

  const { corpora, currentCorpusId, viewportIndex } = props;

  const [selectedCorpusId, setSelectedCorpusId] = useState(currentCorpusId);

  const dispatch = useAppDispatch();

  return (
    <Grid container flexDirection="column" sx={{ flex: 1, p: 2 }}>
      <Typography variant="h6">Settings</Typography>
      <FormControl fullWidth style={{ marginTop: '12px' }}>
        <InputLabel id="select-corpus-input">Corpus</InputLabel>
        <Select
          size="small"
          labelId="select-corpus-label"
          id="select-corpus"
          value={selectedCorpusId}
          label="Corpus"
          onChange={(event) => {
            setSelectedCorpusId(event.target.value);
          }}
        >
          {corpora.map((corpus) => {
            return (
              <MenuItem key={corpus.id} value={corpus.id}>
                {corpus.name}
              </MenuItem>
            );
          })}
        </Select>
        <Button
          disabled={!selectedCorpusId || selectedCorpusId === currentCorpusId}
          onClick={() => {
            dispatch(
              changeCorpusViewport({
                viewportIndex,
                newViewport: { containerId: selectedCorpusId },
              })
            );
          }}
        >
          Update
        </Button>
      </FormControl>
    </Grid>
  );
};

export default CorpusSettingsComponent;
