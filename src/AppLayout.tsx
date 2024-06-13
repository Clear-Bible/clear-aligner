import { Drawer, List, ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import React, { createContext, useContext, useMemo, useState } from 'react';
import Themed from './features/themed';
import { createSearchParams, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import useTrackLocation from './utils/useTrackLocation';
import { AppContext, THEME } from './App';
import { DefaultProjectName } from './state/links/tableManager';
import useBusyDialog from './utils/useBusyDialog';


export interface LayoutContextProps {
  windowTitle: string;
  setWindowTitle: (title: string) => void;
  setMenuBarDelegate: React.Dispatch<
    React.SetStateAction<JSX.Element | string | null>
  >;
}

export const LayoutContext = createContext({} as LayoutContextProps);

interface AppLayoutProps {
  theme: THEME
}

export const AppLayout: React.FC<AppLayoutProps> = ({theme}) => {
  useTrackLocation();
  const busyDialog = useBusyDialog();

  const [showMenu, setShowMenu] = useState(false);
  const [menuBarDelegate, setMenuBarDelegate] = useState(
    null as JSX.Element | string | null
  );
  const layoutContext: LayoutContextProps = useMemo(
    () => ({
      windowTitle: document.title,
      setWindowTitle: (title) => (document.title = title),
      setMenuBarDelegate
    }),
    [setMenuBarDelegate]
  );
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { preferences, projects } = useContext(AppContext);
  const projectName = useMemo(() => (
    (projects || []).find(p =>
      p.id === preferences?.currentProject)?.name
    ?? projects?.[0]?.name
    ?? DefaultProjectName
  ), [projects, preferences?.currentProject]);

  return (
    <LayoutContext.Provider value={layoutContext}>
      <Themed theme={theme}>
        {busyDialog}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}>
          {/*<AppBar position={'fixed'} enableColorOnDark={theme !== 'night'}>*/}
          {/*  <Grid container justifyContent="space-between" alignItems="center" sx={{ position: 'relative' }}>*/}
          {/*    <Toolbar aria-label={'Menu'} onClick={() => setShowMenu(!showMenu)}>*/}
          {/*      <IconButton>*/}
          {/*        <MenuIcon {...(theme !== 'night' && { htmlColor: 'white' })} />*/}
          {/*      </IconButton>*/}
          {/*      <div style={{ width: '100%' }} onClick={() => setShowMenu(true)}>*/}
          {/*        {menuBarDelegate ?? <></>}*/}
          {/*      </div>*/}
          {/*    </Toolbar>*/}
          {/*    <Typography variant="h6" sx={{*/}
          {/*      fontWeight: 'bold',*/}
          {/*      position: 'absolute',*/}
          {/*      top: '50%',*/}
          {/*      left: '50%',*/}
          {/*      transform: 'translate(-50%, -50%)'*/}
          {/*    }}>*/}
          {/*      {projectName}*/}
          {/*    </Typography>*/}
          {/*  </Grid>*/}
          {/*  <Drawer*/}
          {/*    anchor={'left'}*/}
          {/*    open={showMenu}*/}
          {/*    onClose={() => setShowMenu(false)}*/}
          {/*  >*/}
          {/*    <nav>*/}
          {/*      <List>*/}
          {/*        <ListItem disablePadding>*/}
          {/*          <ListItemButton*/}
          {/*            onClick={() => {*/}
          {/*              setShowMenu(false);*/}
          {/*              navigate({*/}
          {/*                pathname: '/',*/}
          {/*                search: createSearchParams(searchParams).toString()*/}
          {/*              });*/}
          {/*            }}*/}
          {/*          >*/}
          {/*            <ListItemIcon>*/}
          {/*              <AddLink />*/}
          {/*            </ListItemIcon>*/}
          {/*            <ListItemText primary={'Alignment Editor'} />*/}
          {/*          </ListItemButton>*/}
          {/*        </ListItem>*/}
          {/*        <ListItem disablePadding>*/}
          {/*          <ListItemButton*/}
          {/*            onClick={() => {*/}
          {/*              setShowMenu(false);*/}
          {/*              navigate({*/}
          {/*                pathname: '/concordance',*/}
          {/*                search: createSearchParams(searchParams).toString()*/}
          {/*              });*/}
          {/*            }}*/}
          {/*          >*/}
          {/*            <ListItemIcon>*/}
          {/*              <ManageSearch />*/}
          {/*            </ListItemIcon>*/}
          {/*            <ListItemText primary={'Concordance View'} />*/}
          {/*          </ListItemButton>*/}
          {/*        </ListItem>*/}
          {/*        <ListItem disablePadding>*/}
          {/*          <ListItemButton*/}
          {/*            onClick={() => {*/}
          {/*              setShowMenu(false);*/}
          {/*              navigate({*/}
          {/*                pathname: '/projects'*/}
          {/*              });*/}
          {/*            }}*/}
          {/*          >*/}
          {/*            <ListItemIcon>*/}
          {/*              <LibraryBooks />*/}
          {/*            </ListItemIcon>*/}
          {/*            <ListItemText primary="Projects" />*/}
          {/*          </ListItemButton>*/}
          {/*        </ListItem>*/}
          {/*      </List>*/}
          {/*    </nav>*/}
          {/*    <br />*/}
          {/*    <div id={'footer'} style={{ marginTop: 'auto' }}>*/}
          {/*      <FormControl fullWidth>*/}
          {/*        <InputLabel id={'theme-label'}>Theme</InputLabel>*/}
          {/*        <Select*/}
          {/*          labelId={'theme-label'}*/}
          {/*          id={'theme-select'}*/}
          {/*          value={preferredTheme}*/}
          {/*          label={'Theme'}*/}
          {/*          onChange={({ target: { value } }) =>*/}
          {/*            setPreferredTheme(value as THEME_PREFERENCE)*/}
          {/*          }*/}
          {/*        >*/}
          {/*          <MenuItem value={'auto' as THEME_PREFERENCE}>*/}
          {/*            Follow System*/}
          {/*          </MenuItem>*/}
          {/*          <MenuItem value={'night' as THEME_PREFERENCE}>Dark</MenuItem>*/}
          {/*          <MenuItem value={'day' as THEME_PREFERENCE}>Light</MenuItem>*/}
          {/*        </Select>*/}
          {/*      </FormControl>*/}
          {/*    </div>*/}
          {/*  </Drawer>*/}
          {/*</AppBar>*/}

          <Drawer variant="permanent" open={false}>
            <List>
              <ListItem disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: "center",
                    px: 2.5,
                  }}
                  onClick={() => {
                    navigate({
                      pathname: '/projects'
                    });
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: "auto",
                      justifyContent: "center",
                    }}
                  >
                    <HomeIcon />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: "center",
                    px: 2.5,
                  }}
                  onClick={() => {
                    navigate({
                      pathname: '/alignment',
                      search: createSearchParams(searchParams).toString()
                    });
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: "auto",
                      justifyContent: "center",
                    }}
                  >
                    <LinkIcon />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: "center",
                    px: 2.5,
                  }}
                  onClick={() => {
                    setShowMenu(false);
                    navigate({
                      pathname: '/concordance',
                      search: createSearchParams(searchParams).toString()
                    });
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: "auto",
                      justifyContent: "center",
                    }}
                  >
                    <SpaceDashboardIcon />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>

          <div id={'outlet'} style={{ marginLeft: '40px', flexGrow: 1, overflow: 'auto' }}>
            <Outlet />
          </div>
        </div>
      </Themed>
    </LayoutContext.Provider>
  );
};
