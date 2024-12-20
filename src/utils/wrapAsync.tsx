export type AsyncFunction = () => Promise<any>;
export type GenericAsyncHandler<T, R> = (t: T) => Promise<R>;

/**
 * wraps an async function with pre and post calls
 * @param pre call to make before delegating to the function
 * @param f handler function
 * @param post call to make after the function returns
 */
export const wrapAsync = <
  T,
  R,
  A extends AsyncFunction,
  H extends GenericAsyncHandler<T, R>,
  P extends AsyncFunction
>(
  pre: A,
  f: H,
  post: P
): GenericAsyncHandler<T, R> => {
  return async (e) => {
    try {
      await pre();
    } finally {
      let result: R;
      try {
        result = await f(e);
      } catch (x) {
        try {
          await post();
        } finally {
          throw x;
        }
      }
      try {
        await post();
      } finally {
        return result;
      }
    }
  };
};
