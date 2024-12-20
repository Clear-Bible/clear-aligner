/**
 * Generate a padded json string
 * @param object array, object, etc. to be serialized
 */
export const generateJsonString = (object: any) =>
  JSON.stringify(object, null, 2);
