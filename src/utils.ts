/**
 * Format a string array into a list
 * @param strArray string array
 * @returns string that represents a list
 *
 * @example
 * > toListStr(['a', 'b'])
 * - a
 * - b
 */
export function formatStrArray(strArray: string[]): string {
  if (strArray.length === 0) {
    return '';
  }
  return strArray.map(s => `- ${s}`).join('\n') + '\n';
}

/**
 * Validate an enum value
 * @param name name of the variable to check
 * @param val value to check
 * @param enumObj enum object
 *
 * @example
 * > enum CD {
 *   C = 'c',
 *   D = 'd',
 * }
 * > validateEnums('a', 'b', CD)
 * Uncaught Error: `a` must be one of ['c', 'd'], but got 'b'
 */
export function validateEnum<T>(
  name: T,
  val: T,
  enumObj: { [key: string]: T },
): never | void {
  const values = Object.values(enumObj);
  if (!values.includes(val)) {
    const wrap = (s: T): string => `'${s}'`;
    const joined = values.map(wrap).join(', ');
    throw new Error(
      `\`${name}\` must be one of [${joined}], but got ${wrap(val)}`,
    );
  }
}
