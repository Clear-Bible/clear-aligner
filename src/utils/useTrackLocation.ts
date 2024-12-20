/**
 * This file contains the useTrackLocation hook which gets called to set up
 * navigation in the CA app.
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../App';
import { UserPreference } from '../state/preferences/tableManager';

const useTrackLocation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { preferences, setPreferences } = React.useContext(AppContext);
  const [redirected, setRedirected] = React.useState(false);

  React.useEffect(() => {
    if (preferences?.id && preferences?.page && !redirected) {
      setRedirected(true);
      navigate(preferences.page);
    }
  }, [navigate, preferences?.page, preferences?.id, redirected]);

  React.useEffect(() => {
    setPreferences((p: UserPreference | undefined) => ({
      ...((p ?? {}) as UserPreference),
      page: location.pathname,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
};

export default useTrackLocation;
