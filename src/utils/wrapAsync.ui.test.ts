import { GenericAsyncHandler, wrapAsync } from './wrapAsync';

test('wrapAsync:happy path', async () => {
  let preCalled = false;
  let postCalled = false;
  const wrapped: GenericAsyncHandler<number, number> = wrapAsync(
    async () => (preCalled = true),
    async (t: number): Promise<number> => {
      return t + t;
    },
    async () => (postCalled = true)
  );

  const result = await wrapped(4);

  expect(result).toBe(8);
  expect(preCalled).toBeTruthy();
  expect(postCalled).toBeTruthy();
});

test('wrapAsync:failing pre', async () => {
  let preCalled = false;
  let postCalled = false;
  const wrapped: GenericAsyncHandler<number, number> = wrapAsync(
    async () => {
      preCalled = true;
      throw new Error('this error should not cause a failure');
    },
    async (t: number): Promise<number> => {
      return t + t;
    },
    async () => (postCalled = true)
  );

  const result = await wrapped(4);

  expect(result).toBe(8);
  expect(preCalled).toBeTruthy();
  expect(postCalled).toBeTruthy();
});

test('wrapAsync:failing function', async () => {
  let preCalled = false;
  let postCalled = false;
  const wrapped: GenericAsyncHandler<number, number> = wrapAsync(
    async () => (preCalled = true),
    async (t: number): Promise<number> => {
      throw new Error(
        'this error should not cause a failure to call the post function'
      );
    },
    async () => (postCalled = true)
  );

  await expect(wrapped(4)).rejects.toThrowError();

  expect(preCalled).toBeTruthy();
  expect(postCalled).toBeTruthy();
});

test('wrapAsync:failing post', async () => {
  let preCalled = false;
  let postCalled = false;
  const wrapped: GenericAsyncHandler<number, number> = wrapAsync(
    async () => (preCalled = true),
    async (t: number): Promise<number> => {
      return t + t;
    },
    async () => {
      postCalled = true;
      throw new Error('this error should not cause a failure');
    }
  );

  const result = await wrapped(4);

  expect(result).toBe(8);
  expect(preCalled).toBeTruthy();
  expect(postCalled).toBeTruthy();
});
