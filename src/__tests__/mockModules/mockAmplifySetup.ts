interface MockAmplifySetupState {
  mockUserGroups: undefined | string[];
}

const generateDefaultState = (): MockAmplifySetupState => ({
  mockUserGroups: undefined,
});

let state: MockAmplifySetupState = generateDefaultState();

/**
 * sets or resets state of module after running tests, optionally modifies the state to specific values
 * @param stateOverride overrides for the module go here
 */
export const setMockAmplifySetupState = (
  stateOverride?: MockAmplifySetupState
) => {
  state = {
    ...generateDefaultState(),
    ...stateOverride,
  };
};

/**
 * get the current state of the amplifySetup module
 */
export const getMockAmplifySetupState = (): MockAmplifySetupState => state;

/**
 * stub for the `amplifySetup` module's `setUpAmplify` function
 */
export const setUpAmplify = () => {};

/**
 * stub for user groups function
 * @param forceRefresh
 */
export const getUserGroups = async (
  forceRefresh?: boolean
): Promise<string[] | undefined> => {
  return state.mockUserGroups;
};
