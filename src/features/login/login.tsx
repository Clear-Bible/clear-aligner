/**
 * This file contains the Login component
 */
import React, { ReactElement, useContext } from 'react';
import { Box } from '@mui/system';
import { Button, DialogTitle, Link, Popover, Stack, Typography, useTheme } from '@mui/material';
import TextField from '@mui/material/TextField';
import { signIn } from "aws-amplify/auth";
import { userState } from '../profileAvatar/profileAvatar';
import { AppContext } from '../../App';
import LogoutIcon from '@mui/icons-material/Logout';

/**
 * Value from .env file which will be injected at build time
 */
declare var CA_AWS_COGNITO_PERMANENT_PASSWORD_CREATION_URL: string;

interface LoginProps {
  isLoginModalOpen: boolean;
  handleLoginModalClose: () => void;
  popOverAnchorEl: HTMLElement | null;
  setUserStatus: Function;
  showLoginError: boolean;
  setShowLoginError: Function;
  showPasswordResetURL: boolean;
  setShowPasswordResetURL: Function;
  emailAddress: string;
  setEmailAddress: Function;
  password: string;
  setPassword: Function
}

/**
 * The Login component is used for user authentication via AWS Cognito
 * and AWS Amplify
 */
export const Login:React.FC<LoginProps> = ({isLoginModalOpen,
                                             handleLoginModalClose,
                                             popOverAnchorEl,
                                             setUserStatus,
                                             setShowLoginError,
                                             showLoginError,
                                             showPasswordResetURL,
                                             setShowPasswordResetURL,
                                             emailAddress,
                                             setEmailAddress,
                                             password,
                                             setPassword}): ReactElement => {
  const theme = useTheme();
  const {setIsSnackBarOpen, setSnackBarMessage } = useContext(AppContext)

  const handleLogin = async() => {
    setShowLoginError(false);
    setShowPasswordResetURL(false);
    try{
      const signInResponse = await signIn({
        username: emailAddress,
        password: password,
      })

      if(signInResponse.isSignedIn){
        setUserStatus(userState.LoggedIn);
        setShowLoginError(false)
        setSnackBarMessage("Signed in to ClearAligner Sync.")
        setIsSnackBarOpen(true);
      }
      else if (signInResponse.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED" || signInResponse.nextStep?.signInStep ===
        "RESET_PASSWORD"){
        setUserStatus(userState.LoggedOut);
        setShowPasswordResetURL(true);
      }
      else {
        setUserStatus(userState.LoggedOut);
        setShowLoginError(true)
      }
    }
    catch (error){
      console.log('error signing in: ', error)
      setShowLoginError(true)
    }
  }

  const handleResetPassword = () => {
    setShowPasswordResetURL(false);
    setPassword("");
    setEmailAddress("");
  }

  const handleOnKeyDown = (e: { keyCode: number; }) => {
    if(e.keyCode === 13){
      handleLogin()
    }
  }

  return (
    <Popover
      open={isLoginModalOpen}
      onClose={handleLoginModalClose}
      anchorEl={popOverAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      onKeyDown={ handleOnKeyDown }
    >
      <Box>
        <DialogTitle>
          <Typography
            color={theme.palette.primary.main}
            align={'center'}
            fontSize={'18px'}
          >
            ClearAligner Sync
          </Typography>
        </DialogTitle>
        <Stack>
          <Box
            component="form"
            sx={{
              '& .MuiTextField-root': { m:1}
            }}
            noValidate
            autoComplete="off"
            px={5}
            pb={6}
          >
            <Stack>
              <TextField
                required
                id="emailAddress"
                label="Email address"
                type="email"
                InputLabelProps={{shrink: true, required: false}}
                onChange={(e) => {
                  setEmailAddress(e.target.value)
                }}
                value={emailAddress}
              />
              <TextField
                required
                id="password"
                label="Password"
                type="password"
                InputLabelProps={{shrink: true, required: false}}
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
              <Button
                variant="contained"
                onClick={handleLogin}
                sx={{
                  borderRadius: 5,
                  marginX: '5px'
                }}
                startIcon={<LogoutIcon/>}
              >Sign In
              </Button>
              {showLoginError &&
                <Box sx={{maxWidth: '250px', paddingX: '5px'}}>
                  <Typography
                    color={'error'}
                    fontSize={'small'}
                    sx={{
                      mt: 1
                    }}
                  >
                    Incorrect email address or password.
                  </Typography>
                </Box>
              }
              {showPasswordResetURL &&
                <Box sx={{maxWidth: '250px', paddingX: '5px'}}>
                  <Typography
                    color={'error'}
                    fontSize={'small'}
                    sx={{
                      mt: 1
                    }}
                  >
                    Please <Link onClick={handleResetPassword}
                                 href={CA_AWS_COGNITO_PERMANENT_PASSWORD_CREATION_URL}
                                 target={"_blank"}
                                 color={"inherit"}
                  >reset your password</Link> before signing in.
                  </Typography>
                </Box>
              }
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Popover>
  );
};

export default Login;
