/**
 * This file contains the ProfileAvatar and the ProfileMenu component
 */
import { Avatar, Button, Menu, MenuItem } from '@mui/material';
import { Person } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import Badge from '@mui/material/Badge';
import React, { useContext, useEffect } from 'react';

import ListItemIcon from '@mui/material/ListItemIcon';
import LogoutIcon from '@mui/icons-material/Logout';
import Login from '../login/login';
import { signOut } from 'aws-amplify/auth';
import { AppContext } from '../../App';
import { blue, green, grey, red } from '@mui/material/colors';

/**
 * userState is an object containing the different user States
 */
export const userState = {
  LoggedIn: {
    color: green['500'],
    label: 'Logged In',
  },
  LoggedOut: {
    color: red['500'],
    label: 'Logged Out',
  },
  Offline: {
    color: grey['500'],
    label: 'Offline',
  },
  CustomEndpoint: {
    color: blue['500'],
    label: 'Custom Server',
  },
};

interface ProfileMenuProps {
  isSignInButtonVisible: boolean;
  isSignInButtonDisabled: boolean;
}

/**
 * The ProfileMenu component is used for users to see the
 * User Profile Menu when the Avatar is clicked
 */
const ProfileMenu: React.FC<ProfileMenuProps> = ({
  isSignInButtonVisible,
  isSignInButtonDisabled,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [popOverAnchorEl, setPopOverAnchorEl] =
    React.useState<null | HTMLElement>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const [showLoginError, setShowLoginError] = React.useState(false);
  const { network, setUserStatus } = useContext(AppContext);
  const { setIsSnackBarOpen, setSnackBarObject } = useContext(AppContext);
  const [showPasswordResetURL, setShowPasswordResetURL] = React.useState(false);
  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLoginClick = (event: {
    currentTarget: React.SetStateAction<HTMLElement | null>;
  }) => {
    setPopOverAnchorEl(document.getElementById('anchorButton'));
    handleClose();

    setIsLoginModalOpen(true);
  };
  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
    setShowLoginError(false);
    setShowPasswordResetURL(false);
    setPassword('');
    setEmailAddress('');
  };
  const handleSignOut = async () => {
    try {
      await signOut();
      setIsSnackBarOpen(true);
      setSnackBarObject({
        message: 'Signed out of ClearAligner Sync.',
        autoHide: true,
      });
      setUserStatus(userState.LoggedOut);
      handleClose();
    } catch (error) {
      console.log('error signing out: ', error);
    }
  };
  return (
    <div>
      <Button
        id="anchorButton"
        sx={{
          color: 'white',
        }}
        onClick={handleClick}
      >
        <Person />
      </Button>

      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {isSignInButtonVisible ? (
          <MenuItem
            onClick={handleLoginClick}
            disabled={isSignInButtonDisabled}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign in to ClearAligner Sync
          </MenuItem>
        ) : (
          <MenuItem disabled={network.online === false} onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            Sign out of ClearAligner Sync
          </MenuItem>
        )}
      </Menu>
      <Login
        isLoginModalOpen={isLoginModalOpen}
        handleLoginModalClose={handleLoginModalClose}
        popOverAnchorEl={popOverAnchorEl}
        setUserStatus={setUserStatus}
        showLoginError={showLoginError}
        setShowLoginError={setShowLoginError}
        showPasswordResetURL={showPasswordResetURL}
        setShowPasswordResetURL={setShowPasswordResetURL}
        emailAddress={emailAddress}
        setEmailAddress={setEmailAddress}
        password={password}
        setPassword={setPassword}
      />
    </div>
  );
};

/**
 * This ProfileAvatar component is used for users to access a menu
 * with login/logout, settings, about, etc.
 */
export const ProfileAvatar = () => {
  const [isSignInButtonVisible, setIsSignInButtonVisible] =
    React.useState(true);
  const [isSignInButtonDisabled, setIsSignInButtonDisabled] =
    React.useState(false);
  const { network, userStatus } = useContext(AppContext);

  // Update Network and Logged In Status
  useEffect(() => {
    if (network.online) {
      setIsSignInButtonDisabled(false);
    } else {
      setIsSignInButtonDisabled(true);
    }
  }, [network]);

  useEffect(() => {
    if (userStatus === userState.LoggedIn) {
      setIsSignInButtonVisible(false);
    } else if (userStatus === userState.LoggedOut) {
      setIsSignInButtonVisible(true);
    }
  }, [userStatus]);

  const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
      backgroundColor: userStatus.color,
      color: userStatus.color,
      boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
      '&::after': {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        animation: 'ripple 1.2s infinite ease-in-out',
        border: '1px solid currentColor',
        content: '""',
      },
    },
  }));

  return (
    <>
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          margin: 1,
        }}
      >
        <Avatar
          sx={{
            height: 30,
            width: 30,
          }}
        >
          <ProfileMenu
            isSignInButtonVisible={isSignInButtonVisible}
            isSignInButtonDisabled={isSignInButtonDisabled}
          />
        </Avatar>
      </StyledBadge>
    </>
  );
};
