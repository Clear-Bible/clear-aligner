/**
 * This file sets up the MUI Theme via the Themed wrapper component.
 */

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Not sure yet if we really need to manually load these.
// import '@fontsource/roboto/300.css';
// import '@fontsource/roboto/400.css';
// import '@fontsource/roboto/500.css';
// import '@fontsource/roboto/700.css';

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark"
}

const baseDarkTheme = createTheme({
  palette: {
    mode: ThemeMode.DARK,
  },
});
const baseLightTheme = createTheme({
  palette: {
    mode: ThemeMode.LIGHT,
  },
});

const darkTheme = createTheme({
  palette: {
    mode: ThemeMode.DARK,
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: baseDarkTheme.palette.grey['500'],
    },
    selected: {
      color: baseDarkTheme.palette.grey['50'],
      backgroundColor: baseDarkTheme.palette.grey['600'],
      borderRadius: '0.25rem',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: ThemeMode.LIGHT,
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: baseLightTheme.palette.grey['500'],
    },
    selected: {
      color: baseLightTheme.palette.grey['50'],
      backgroundColor: baseLightTheme.palette.grey['800'],
      borderRadius: '0.25rem',
    },
  },
  components: {
    MuiDrawer:{
      styleOverrides:{
        paper:{
          backgroundColor: '#eeeeee'
        }
      }
    },
    MuiToolbar:{
      styleOverrides:{
        root: {
          paddingLeft: "12px !important",
          paddingTop: "12px",
          paddingRight: "12px !important",
          paddingBottom: "6px",
        }
      }
    },
    MuiBadge:{
      styleOverrides:{
        root: {
          marginRight: "0px !important"
        }
      }
    },
    MuiAppBar:{
      styleOverrides:{
        root: ({theme}) => ({
          boxShadow: "none",
          color: theme.palette.primary.main,
        }),
        colorPrimary:{
          backgroundColor: "white"
        }
      }
    }
  }
});

interface ThemedProps {
  theme: 'day' | 'night';
  children: any;
}

const Themed = (props: ThemedProps) => {
  const { theme, children } = props;
  const chosenTheme = theme === 'night' ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={chosenTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default Themed;
