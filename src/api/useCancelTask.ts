import React from 'react';

export interface CancelToken {
  canceled: boolean;
}
const useCancelTask = () => {
  const cancelToken = React.useRef<CancelToken>({ canceled: false });
  const cancel = () => (cancelToken.current.canceled = true);
  const reset = () => (cancelToken.current.canceled = false);

  return { cancel, reset, cancelToken: cancelToken.current };
};

export default useCancelTask;
