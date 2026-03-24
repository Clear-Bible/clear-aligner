import React, { createContext, useContext, useEffect, useMemo } from 'react';
import Themed from './features/themed';
import { Outlet } from 'react-router-dom';
import useTrackLocation from './utils/useTrackLocation';
import { AppContext, THEME } from './App';
import useBusyDialog from './utils/useBusyDialog';
import { MiniDrawer } from './features/miniDrawer/miniDrawer';
import { Box } from '@mui/system';
import BCVWP from './features/bcvwp/BCVWPSupport';
import { DEFAULT_DOCUMENT_TITLE } from './common/constants';
import {
  BusyDialogContext,
  BusyDialogContextProps,
  useBusyDialogContext,
} from './utils/useBusyDialogContext';
import { CustomSnackbar } from './features/snackbar';

export interface LayoutContextProps {
  windowTitle: string;
  setWindowTitle: (title: string) => void;
}

export const LayoutContext = createContext({} as LayoutContextProps);

interface AppLayoutProps {
  theme: THEME;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ theme }) => {
  useTrackLocation();
  const busyDialogContext: BusyDialogContextProps = useBusyDialogContext();
  const { isOpen: busyDialogOpen, busyDialog } =
    useBusyDialog(busyDialogContext);
  const appCtx = useContext(AppContext);
  const currentPosition = useMemo<BCVWP>(
    () => appCtx.preferences?.bcv ?? new BCVWP(1, 1, 1),
    [appCtx.preferences?.bcv]
  );
  const layoutContext: LayoutContextProps = useMemo(
    () => ({
      windowTitle: document.title,
      setWindowTitle: (title) => (document.title = title),
    }),
    []
  );

  // set the initial document title. This ensures we show a BCV in the document
  // title even when the app initially launches on a route other than the
  // alignment editor
  useEffect(() => {
    if (currentPosition) {
      document.title = `${DEFAULT_DOCUMENT_TITLE}: ${
        currentPosition.getBookInfo()?.EnglishBookName
      } ${currentPosition?.chapter}:${currentPosition?.verse}`;
    } else {
      document.title = DEFAULT_DOCUMENT_TITLE;
    }
  }, [currentPosition]);

  // Ensure we don't show the busyDialog concurrently
  // with one of the project dialogs
  const { isProjectDialogOpen, setIsBusyDialogOpen } = useContext(AppContext);

  useEffect(() => {
    setIsBusyDialogOpen(!isProjectDialogOpen && busyDialogOpen);
  }, [busyDialogOpen, isProjectDialogOpen, setIsBusyDialogOpen]);

  return (
    <LayoutContext.Provider value={layoutContext}>
      <BusyDialogContext.Provider value={busyDialogContext}>
        <Themed theme={theme}>
          {!isProjectDialogOpen ? busyDialog : null}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ display: 'flex' }}>
              <MiniDrawer />
              <div
                id={'outlet'}
                style={{
                  flexGrow: 1,
                  height: '100vh',
                  overflowX: 'hidden',
                  overflowY: 'hidden',
                }}
              >
                <Outlet />
              </div>
            </Box>
          </div>
          <CustomSnackbar />
        </Themed>
      </BusyDialogContext.Provider>
    </LayoutContext.Provider>
  );
};
