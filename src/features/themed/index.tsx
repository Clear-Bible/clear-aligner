/**
 * This file sets up the MUI Theme via the Themed wrapper component.
 */

import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { CssBaseline, Theme } from '@mui/material';
import { green, grey, orange, red, yellow } from '@mui/material/colors';

export enum ThemeMode {
  LIGHT = "light",
  DARK = "dark"
}

const lightTheme: Theme = createTheme({
  palette: {
    mode: ThemeMode.LIGHT,
    text: {
      primary: '#000000'
    },
    primary: {
      main: '#219ECF', // Cerulean Blue 500
      dark: '#1990C1', // Cerulean Blue 600
      light: '#39ABD4', // Cerulean Blue 400
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#FF7F50', // Coral 400
      dark: '#F5642F', // Coral 600
      light: '#FEB399', // Coral 200
      contrastText: '#FFFFFF'
    },
    error: {
      main: red[500],
      dark: red[600],
      light: red[400],
      contrastText: '#FFFFFF'
    },
    warning:{
      main: orange[600],
      dark: orange[800],
      light: orange[500],
      contrastText: '#FFFFFF'
    },
    info:{
      main: '#0F7EAF', // Cerulean Blue 700
      dark: '#044F7A', // Cerulean Blue 900
      light: '#219ECF', // Cerulean Blue 500
      contrastText: '#FFFFFF'
    },
    success:{
      main: green[500],
      dark: green[600],
      light: green[400],
      contrastText: '#FFFFFF'
    },
    statusIndicators: {
      aligned: '#219ECF', // Cerulean Blue 500
      approved: '#47CF21', // Green 500
      flagged: '#FB8C00', // Orange 600
      rejected: '#F44336', // Red 500
    },
    statusIndicatorsIcons: {
      aligned: '#219ECF', // Cerulean Blue 500
      rejected: red['500'],
      approved: green['500'],
      flagged: orange['600'],
    },
    toggleButtons: {
      disabled: {
        color: alpha('#000000', .38),
        stroke: alpha('#000000', .12),
        background: alpha('#000000', 0),
        borderColor: '#e0e0e0',
      },
      enabled: {
        color: alpha('#000000', .54),
        stroke: alpha('#000000', .12),
        background: alpha('#000000', 0),
        borderColor: '#e0e0e0',
      },
      hover: {
        color: alpha('#000000', .54),
        stroke: alpha('#000000', .12),
        background: alpha('#000000', .04),
        borderColor: '#d3d3d3',
      },
      selected: {
        color: '#FFFFFF',
        stroke: alpha('#000000', .12),
      },
    },
    highlightedText: {
      alignmentEditor: yellow[200],
    },
    snackbar: {
      errorText: '#f44336', // MUI Red[500]
    },
    tokenButtons: {
      defaultTokenButtons: {
        default: '#00000000', // Transparent
        text: '#000000',
        outline: '#DCDCDC',
        rollover: yellow[100],
        selected: yellow[500],
      },
      alignedTokenButtons :{
        default: '#00000000', // Transparent
        text: '#000000', // Black
        textReversed: '#FFFFFF', // White
        outline: '#219ECF', // Cerulean Blue 500
        rollover: '#E0F3F8', // Cerulean Blue 50
        selected: '#219ECF', // Cerulean Blue 500
        icons: '#219ECF', // Cerulean Blue 500
        iconsReversed: '#E0F3F8' // Cerulean Blue 50
      },
      machineAlignedTokenButtons :{
        default: '#00000000', // Transparent
        text: '#000000', // Black
        textReversed: '#FFFFFF', // White
        outline: 'linear-gradient(#33D6FF, #AD8CFF)',
        rollover: '#E0F3F8', // Cerulean Blue 50
        selected: '#219ECF', // Cerulean Blue 500
        icons: 'linear-gradient(#33D6FF, #AD8CFF)',
        iconsReversed: '#E0F3F8', // Cerulean Blue 50
      },
      approvedTokenButtons :{
        default: '#00000000', // Transparent
        text: '#000000', // Black
        textReversed: '#FFFFFF', // White
        outline: green[500],
        rollover: green[50],
        selected: green[500],
        icons: green[500],
        iconsReversed: green[50]
      },
      flaggedTokenButtons :{
        default: '#00000000', // Transparent
        text: '#000000', // Black
        textReversed: '#FFFFFF', // White
        outline: orange[600],
        rollover: orange[50],
        selected: orange[600],
        icons: orange[600],
        iconsReversed: orange[50]
      },
      excludedTokenButtons : {
        text: '#999999'
      },
      suggestedTokenButtons : {
        icon: '#FAEBE9', // Coral 50
      }
    },
    controlPanel: {
      cancel: {
        main: grey[300]
      },
      delete: {
        main: '#EF5350'
      }
    },
    background :{
      paper: '#FAFAFA',
      default: '#FAFAFA'
    },
    transparent: '#00000000',
    linkStateSelector: {
      border: alpha('#000000', .12),
      backgroundColor: '#FFFFFF',
    },
    alignmentStateMenu: {
      check: alpha('#000000', .56)
    }
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: grey['500'],
    },
    linked: {
      color: '#000000',
    },
    selected: {
      color: grey['50'],
      backgroundColor: grey['800'],
      borderRadius: '0.25rem',
    },
  },
  components: {
    MuiDrawer:{
      styleOverrides:{
        paper:{
          backgroundColor: '#f5f5f5'
        }
      }
    },
    MuiToolbar:{
      styleOverrides:{
        root: {
          paddingLeft: "12px !important",
          paddingTop: "5.5px",
          paddingRight: "12px !important",
          paddingBottom: "6px",
          maxHeight: "58px !important",
          minHeight: "58px !important"
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
          backgroundColor: theme.palette.background.default,
          backgroundImage: "none",
        }),
      }
    }
  }
});

const darkTheme = createTheme({
  palette: {
    mode: ThemeMode.DARK,
    text: {
      primary: '#FFFFFF'
    },
    primary: {
      main: '#56B9DA', // Cerulean Blue 300
      dark: '#39ABD4', // Cerulean Blue 400
      light: '#E0F3F8', // Cerulean Blue 50
      contrastText: '#000000'
    },
    secondary: {
      main: '#FEB399', // Coral 200
      dark: '#FF7F50', // Coral 400
      light: '#FAEBE9', // Coral 50
      contrastText: '#000000'
    },
    error: {
      main: red[400],
      dark: red[500],
      light: red[300],
      contrastText: '#000000'
    },
    warning:{
      main: orange[400],
      dark: orange[700],
      light: orange[300],
      contrastText: '#000000'
    },
    info:{
      main: '#39ABD4', // Cerulean Blue 400
      dark: '#0F7EAF', // Cerulean Blue 700
      light: '#56B9DA', // Cerulean Blue 300
      contrastText: '#000000'
    },
    success:{
      main: green[300],
      dark: green[500],
      light: green[200],
      contrastText: '#000000'
    },
    statusIndicators: {
      aligned: '#219ECF', // Cerulean Blue 500
      approved: green[500],
      flagged: orange[600],
      rejected: red[500],
    },
    statusIndicatorsIcons: {
      aligned: '#219ECF', // Cerulean Blue 500
      rejected: red['500'],
      approved: green['500'],
      flagged: orange['600'],
    },
    toggleButtons: {
      disabled: {
        color: alpha('#FFFFFF', .38),
        stroke: alpha('#FFFFFF', .12),
        background: alpha('#FFFFFF', 0),
        borderColor: grey[700],
      },
      enabled: {
        color: alpha('#FFFFFF', .70),
        stroke: alpha('#FFFFFF', .12),
        background: alpha('#FFFFFF', 0),
        borderColor: grey[700],
      },
      hover: {
        color: alpha('#FFFFFF', .70),
        stroke: alpha('#FFFFFF', .12),
        background: alpha('#FFFFFF', .08),
        borderColor: grey[500],
      },
      selected: {
        color: '#FFFFFF',
        stroke: alpha('#FFFFFF', .12),
      },
    },
    highlightedText: {
      alignmentEditor: yellow[700],
    },
    snackbar: {
      errorText: '#f44336', // MUI Red[500]
    },
    tokenButtons: {
      defaultTokenButtons: {
        default: '#00000000', //Transparent
        text: '#FFFFFF',
        textContrast: '#000000',
        outline: '#3C3C3C',
        rollover: alpha('#FFEB3B', .25), // Yellow 500 @ 25%
        selected: '#FFF176' // Yellow 300
      },
      alignedTokenButtons: {
        default: '#00000000', // Transparent
        text: '#FFFFFF',
        textContrast: '#000000',
        outline: '#56B9DA', // Cerulean Blue 300
        rollover: alpha('#219ECF', .08),  // Cerulean Blue 500 @ 8%
        selected: '#56B9DA', // Cerulean Blue 300
        icons: '#56B9DA', // Cerulean Blue 300
        iconsContrast: '#044F7A' // Cerulean Blue 900
      },
      machineAlignedTokenButtons: {
        default: '#00000000', // Transparent
        text: '#FFFFFF',
        textContrast: '#000000',
        outline: 'linear-gradient(#33D6FF, #AD8CFF)',
        rollover: alpha('#219ECF', .08), // Cerulean Blue 500 @ 8%
        selected: '#56B9DA', // Cerulean Blue 300
        icons: 'linear-gradient(#33D6FF, #AD8CFF)',
        iconsContrast: '#044F7A', // Cerulean Blue 900
      },
      approvedTokenButtons : {
        default: '#00000000', // Transparent
        text: '#FFFFFF',
        textContrast: '#000000',
        outline: green[300],
        rollover: alpha('#47CF21', .08 ), // Green 500 @ 8%
        selected: green[300],
        icons: green[300],
        iconsReversed: green[800],
      },
      flaggedTokenButtons : {
        default: '#00000000', // Transparent
        text: '#FFFFFF',
        textContrast: '#000000',
        outline: orange[400],
        rollover: alpha('#FB8C00', .08), // Orange 600 @ 8%
        selected: orange[400],
        icons: orange[400],
        iconsReversed: orange[800],
      },
      excludedTokenButtons : {
        text: '#999999'
      },
      suggestedTokenButtons : {
        icon: '#FAEBE9', // Coral 50
      }
    },
    controlPanel: {
      cancel: {
        main: grey[300],
      },
      delete: {
        main: '#E57373'
      }
    },
    background : {
      paper: '#1E1E1E',
      default: '#121212',
    },
    transparent: '#00000000',
    linkStateSelector: {
      border: alpha('#000000', .12),
      backgroundColor: alpha('#FFFFFF', .12)
    },
    alignmentStateMenu: {
      check: alpha('#FFFFFF', .86)
    }
  },
  typography: {
    unlinked: {
      fontStyle: 'italic',
      color: grey['500'],
    },
    linked: {
      color: '#FFFFFF',
    },
    selected: {
      color: grey['50'],
      backgroundColor: grey['600'],
      borderRadius: '0.25rem',
    },
  },
  components:{
    MuiDrawer:{
      styleOverrides:{
        paper:{
          backgroundColor: '#1E1E1E'
        }
      }
    },
    MuiToolbar:{
      styleOverrides:{
        root: {
          paddingLeft: "12px !important",
          paddingTop: "5.5px",
          paddingRight: "12px !important",
          paddingBottom: "6px",
          maxHeight: "58px !important",
          minHeight: "58px !important"
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
          backgroundColor: theme.palette.background.default,
          backgroundImage: "none",
        }),
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
