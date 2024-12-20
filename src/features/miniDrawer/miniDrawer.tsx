/**
 * This file contains the MiniDrawer component which is used for the main
 * navigation of the App.
 */
import * as React from 'react';
import ListItem from '@mui/material/ListItem';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Drawer, IconButton, Stack, Tooltip, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';
import SvgIcon from '@mui/material/SvgIcon';
import { ReactComponent as LogoLight } from '../../common/assets/clearAlignerLogoLight.svg';
import { ReactComponent as LogoDark } from '../../common/assets/clearAlignerLogoDark.svg';

/**
 * This component is used as the main navigation for the app
 */
export const MiniDrawer = () => {
  const [selectedIndex, setSelectedIndex] = React.useState('');
  const drawerWidth = 48;
  const theme = useTheme();

  const ListItems = {
    Home: {
      key: '/projects',
      path: '/projects',
      displayName: 'Home/Projects',
    },
    Alignment: {
      key: '/alignment',
      path: '/alignment',
      displayName: 'Alignment Editor',
    },
    Concordance: {
      key: '/concordance',
      path: '/concordance',
      displayName: 'Concordance',
    },
    Icon: {
      key: 'clearAlignerIcon',
    },
  };

  const location = useLocation();
  useEffect(() => {
    setSelectedIndex(location.pathname);
  }, [location.pathname]);

  const navigate = useNavigate();

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none !important',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <Stack
        direction={'column'}
        justifyContent={'space-between'}
        alignItems={'center'}
        sx={{ height: '100vh' }}
      >
        <Stack>
          <ListItem
            key={ListItems.Icon.key}
            sx={{ display: 'flex', flexDirection: 'column', px: 0 }}
          >
            <SvgIcon sx={{ height: '42px', width: '42px' }}>
              {theme.palette.mode === 'light' ? <LogoLight /> : <LogoDark />}
            </SvgIcon>
          </ListItem>
          <ListItem
            key={ListItems.Home.key}
            sx={{ display: 'flex', flexDirection: 'column', px: 0 }}
          >
            <Tooltip title={ListItems.Home.displayName} placement="right" arrow>
              <IconButton
                onClick={() => {
                  navigate({ pathname: ListItems.Home.path });
                }}
                color={
                  selectedIndex === ListItems.Home.path ? 'primary' : 'default'
                }
                sx={{
                  p: 1,
                  backgroundColor:
                    selectedIndex === ListItems.Home.path
                      ? theme.palette.mode === 'light'
                        ? grey['400']
                        : grey['600']
                      : null,
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? grey['400']
                        : grey['600'],
                  },
                }}
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <ListItem
            key={ListItems.Alignment.key}
            sx={{ display: 'flex', flexDirection: 'column', px: 0 }}
          >
            <Tooltip
              title={ListItems.Alignment.displayName}
              placement="right"
              arrow
            >
              <IconButton
                onClick={() => {
                  navigate({ pathname: ListItems.Alignment.path });
                }}
                color={
                  selectedIndex === ListItems.Alignment.path
                    ? 'primary'
                    : 'default'
                }
                sx={{
                  p: 1,
                  backgroundColor:
                    selectedIndex === ListItems.Alignment.path
                      ? theme.palette.mode === 'light'
                        ? grey['400']
                        : grey['600']
                      : null,
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? grey['400']
                        : grey['600'],
                  },
                }}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <ListItem
            key={ListItems.Concordance.key}
            sx={{ display: 'flex', flexDirection: 'column', px: 0 }}
          >
            <Tooltip
              title={ListItems.Concordance.displayName}
              placement="right"
              arrow
            >
              <IconButton
                onClick={() => {
                  navigate({ pathname: ListItems.Concordance.path });
                }}
                color={
                  selectedIndex === ListItems.Concordance.path
                    ? 'primary'
                    : 'default'
                }
                sx={{
                  p: 1,
                  backgroundColor:
                    selectedIndex === ListItems.Concordance.path
                      ? theme.palette.mode === 'light'
                        ? grey['400']
                        : grey['600']
                      : null,
                  '&:hover': {
                    backgroundColor:
                      theme.palette.mode === 'light'
                        ? grey['400']
                        : grey['600'],
                  },
                }}
              >
                <SpaceDashboardIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
        </Stack>
      </Stack>
    </Drawer>
  );
};
