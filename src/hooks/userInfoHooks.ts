import { useContext, useEffect, useMemo, useState } from 'react';
import { getUserGroups } from '../server/amplifySetup';
import uuid from 'uuid-random';
import { useNetworkState } from '@uidotdev/usehooks';
import { AppContext } from '../App';
import { userState } from '../features/profileAvatar/profileAvatar';
import { ApiUtils } from '../api/utils';
import generateRequest = ApiUtils.generateRequest;
import RequestType = ApiUtils.RequestType;
import { AuthSession, fetchAuthSession } from 'aws-amplify/auth';
import { useMemoAsync } from './useMemoAsync';

/**
 * name of the admin group, for comparison
 */
export const ADMIN_GROUP = 'admin';

/**
 * props for {@link useCurrentUserGroups} hook
 */
export interface UseCurrentUserGroupsProps {
  forceRefresh?: boolean;
  refreshKey?: string
}

/**
 * Retrieve the list of groups the current user belongs to
 * @param forceRefresh whether the request for the current user's groups should trigger a refresh from the server
 * @param refreshKey updating this key triggers an update
 */
export const useCurrentUserGroups = ({ forceRefresh, refreshKey }: UseCurrentUserGroupsProps) => {
  const [ groups, setGroups ] = useState<string[]>();
  const [ lastRefreshKey, setLastRefreshKey ] = useState<string>(uuid());
  const network = useNetworkState();

  useEffect(() => {
    if (lastRefreshKey === refreshKey) return;
    if (!network?.online) return;
    getUserGroups(forceRefresh)
      .then((groups) => {
        setGroups(groups ?? []);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!!refreshKey)
          setLastRefreshKey(refreshKey);
      })
  }, [forceRefresh, refreshKey, setLastRefreshKey, lastRefreshKey, network?.online]);

  return groups;
}

/**
 * hook to retrieve whether the user is currently signed in
 */
export const useIsSignedIn = (): boolean => {
  const { userStatus } = useContext(AppContext);

  return useMemo(() => userStatus === userState.LoggedIn || userStatus === userState.CustomEndpoint, [userStatus]);
}

/**
 * convenience hook for checking if the current user is an admin or not
 * @param forceRefresh whether the request for the current user's groups should trigger a refresh from the server
 * @param refreshKey updating this key triggers an update
 */
export const useIsAdmin = ({ forceRefresh, refreshKey }: UseCurrentUserGroupsProps): boolean => {
  const groups = useCurrentUserGroups({ forceRefresh, refreshKey });
  return (groups ?? []).includes(ADMIN_GROUP);
}

/**
 * retrieve the email address of the current user
 */
export const useUserEmail = ({ forceRefresh, refreshKey }: UseCurrentUserGroupsProps): string|undefined => {
  const session = useMemoAsync<AuthSession>(async () => {
    const s = await fetchAuthSession({ forceRefresh: forceRefresh ?? !!refreshKey });
    return s;
  }, [ forceRefresh, refreshKey ]);

  const email = useMemo<string|undefined>(() => session?.tokens?.accessToken.payload.email as string|undefined, [ session?.tokens?.accessToken.payload.email ]);

  return email;
}

/**
 * retrieve user list from server
 */
export const useUsersFromServer = (): string[]|undefined => {
  const [ userList, setUserList ] = useState<string[]>();

  useEffect(() => {
    const retrieveList = async () => {
      const usersResponse = await generateRequest<string[]>({
        requestPath: '/api/non_admin_users',
        requestType: RequestType.GET
      });
      if (usersResponse.success) {
        const list = await (usersResponse.response as any).body.json()
        setUserList(list as string[]);
      }
    };
    void retrieveList();
  }, [ setUserList ]);

  return userList;
}
