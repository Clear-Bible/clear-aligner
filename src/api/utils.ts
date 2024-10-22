import {
  ClearAlignerApiName,
  getApiOptionsWithAuth,
  CaApiEndpointIsDev, EffectiveCaApiEndpoint
} from '../server/amplifySetup';
import { del, get, patch, post, put } from 'aws-amplify/api';
import { generateJsonString } from '../common/generateJsonString';
import { RestApiResponse } from '@aws-amplify/api-rest/src/types';

export module ApiUtils {

  export enum RequestType {
    GET = 'GET',
    POST = 'POST',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
    PUT = 'PUT',
  }

  const getAmplifyFromRequestType = (requestType: RequestType) => {
    switch (requestType) {
      case RequestType.GET:
        return get;
      case RequestType.POST:
        return post;
      case RequestType.PATCH:
        return patch;
      case RequestType.DELETE:
        return del;
      case RequestType.PUT:
        return put;
      default:
        throw new Error('Unable to find Amplify equivalent for: ', requestType);
    }
  };

  const isJsonContentType = (inputContentType?: string | null) => {
    if (!inputContentType) {
      return false;
    }
    return inputContentType.includes('application/json');
  };

  const getContentLength = (inputContentLength?: number | string | null) => {
    if (!inputContentLength) {
      return 0;
    }
    return +inputContentLength;
  };

  const getFetchResponseObject = async (response: Response, contentLengthOptional = false) => {
    if (response.ok
      && isJsonContentType(response.headers.get('content-type'))
      && (contentLengthOptional || getContentLength(response.headers.get('content-length')) > 0)) {
      return await (response.json());
    } else {
      return {};
    }
  };

  const getAmplifyResponseObject = async (response: RestApiResponse, contentLengthOptional = false) => {
    if (response.statusCode === 200
      && isJsonContentType(response.headers['content-type'])
      && (contentLengthOptional || getContentLength(response.headers['content-length']) > 0)
      && 'body' in response) {
      return await (response.body as Response).json();
    } else if (response.statusCode) {
      return {
        ...response
      };
    } else {
      return {};
    }
  };

  const validateStatusCode = (statusCode: number, requestType: RequestType, expectedStatusCode?: number) => {
    if (expectedStatusCode) {
      return statusCode === expectedStatusCode;
    }
    switch (requestType) {
      case RequestType.GET:
      case RequestType.PATCH:
      case RequestType.PUT:
      case RequestType.POST:
        return statusCode >= 200 && statusCode < 300;
      case RequestType.DELETE:
        return statusCode === 204;
      default:
        return false;
    }
  };

  interface RequestGenerationPayload {
    requestPath: string,
    requestType: RequestType,
    payload?: any,
    signal?: AbortSignal,
    contentLengthOptional?: boolean,
  }

  interface RequestGenerationOptions {
    expectedStatusCode: number;
  }

  /**
   * Response object model
   */
  export interface ResponseObject<T> {
    success: boolean;
    response: {
      statusCode: number;
    };
    body: T;
  }

  export const generateRequest = async <T> ({
                                          requestPath,
                                          requestType,
                                          payload,
                                          signal,
                                          contentLengthOptional
                                        }: RequestGenerationPayload, options: Partial<RequestGenerationOptions> = {}): Promise<ResponseObject<T>> => {
    if (CaApiEndpointIsDev) {
      const response = await fetch(`${EffectiveCaApiEndpoint}${requestPath}`, {
        method: requestType,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json'
        },
        ...(signal ? { signal } : {}),
        ...(payload ? { body: generateJsonString(payload) } : {})
      });
      return {
        success: response.ok,
        response: { statusCode: response.status },
        body: await getFetchResponseObject(response,
          contentLengthOptional ?? requestType === RequestType.GET)
      };
    } else {
      const responseOperation = getAmplifyFromRequestType(requestType)({
        apiName: ClearAlignerApiName,
        path: requestPath,
        options: payload ? getApiOptionsWithAuth(payload) : getApiOptionsWithAuth()
      });
      let response;
      try {
        response = await responseOperation.response;
      } catch(x) {
        response = (x as any ?? {}).response;
      }
      if (signal) {
        signal.onabort = () => {
          responseOperation.cancel();
        };
      }
      return {
        success: validateStatusCode(response.statusCode, requestType, options.expectedStatusCode),
        response: (response as RestApiResponse),
        body: await getAmplifyResponseObject(response as RestApiResponse,
          contentLengthOptional || requestType === RequestType.GET)
      };
    }
  };
}
