import { Amplify } from 'aws-amplify';
import { DocumentType } from '@aws-amplify/core/internals/utils';
import { RestApiOptionsBase } from '@aws-amplify/api-rest/src/types';
import { EnvironmentVariables } from '../structs/environmentVariables';
import { fetchAuthSession } from 'aws-amplify/auth';

const environmentVariables = ((window as any).environmentVariables ??
  {}) as EnvironmentVariables;

export const OverrideCaApiEndpoint = environmentVariables.caApiEndpoint;
export const OverrideUserPoolId = environmentVariables.userPoolId;
export const OverrideUserPoolClientId = environmentVariables.userPoolClientId;

/**
 * Values from .env file which will be injected at build time
 */
declare var CA_AWS_ENDPOINT: string;
declare var CA_AWS_COGNITO_USER_POOL_ID: string;
declare var CA_AWS_COGNITO_USER_POOL_CLIENT_ID: string;

export const DefaultCaApiEndpoint = CA_AWS_ENDPOINT;
export const DefaultUserPoolId = CA_AWS_COGNITO_USER_POOL_ID;
export const DefaultUserPoolClientId = CA_AWS_COGNITO_USER_POOL_CLIENT_ID;

export const CaApiEndpointIsDev =
  (environmentVariables.caApiEndpointIsDev ?? 'false') === 'true';
export const EffectiveCaApiEndpoint =
  OverrideCaApiEndpoint ?? DefaultCaApiEndpoint;
export const ClearAlignerApiName = 'ClearAlignerApi';

/**
 * One-time setup of AWS amplify capabilities.
 */
export const setUpAmplify = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: OverrideUserPoolId ?? DefaultUserPoolId,
        userPoolClientId: OverrideUserPoolClientId ?? DefaultUserPoolClientId,
        identityPoolId: '',
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true,
          },
        },
        allowGuestAccess: true,
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true,
        },
      },
    },
  });

  const currConfig = Amplify.getConfig();

  Amplify.configure({
    ...currConfig,
    API: {
      ...currConfig.API,
      REST: {
        ...currConfig.API?.REST,
        ClearAlignerApi: {
          endpoint: EffectiveCaApiEndpoint,
        },
      },
    },
  });
};

/**
 * get groups user is a member of, undefined if the user is not logged in
 */
export const getUserGroups = async (
  forceRefresh?: boolean
): Promise<[] | undefined> => {
  const authSession = await fetchAuthSession({ forceRefresh });
  const payload = authSession.tokens?.accessToken?.payload;
  if (!payload) return undefined;
  return (payload['cognito:groups'] ?? []) as [];
};

/**
 * Retrieve key from local storage, if it exists and return it
 */
export const getAuthorizationToken = (): string | undefined => {
  for (const key in localStorage) {
    if (
      key.startsWith('CognitoIdentityServiceProvider.') &&
      key.endsWith('.accessToken')
    ) {
      return localStorage[key];
    }
  }
  return undefined;
};

/**
 * Generate an API document object from an arbitrary input.
 * @param inputObject Any input.
 */
export const getDocumentType = (inputObject?: any): DocumentType => {
  return (inputObject ?? null) as DocumentType;
};

/**
 * Generate an options block ready for use in API calls, including an optional request body.
 * @param inputBody Optional request body.
 */
export const getApiOptionsWithAuth = (inputBody?: any): RestApiOptionsBase => {
  const cognitoKey = getAuthorizationToken();
  return {
    body: getDocumentType(inputBody),
    headers: {
      Authorization: cognitoKey ? `Bearer ${cognitoKey}` : '',
    },
  };
};
