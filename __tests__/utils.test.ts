import { formatStrArray, validateEnum } from '../src/utils';

describe('utils', () => {
  it(formatStrArray.name, () => {
    expect(formatStrArray(['a', 'b', 'c'])).toBe('- a\n- b\n- c\n');
    expect(formatStrArray([])).toBe('');
  });

  it(validateEnum.name, () => {
    enum B {
      B = 'b',
    }
    expect(validateEnum('a', 'b' as string, B)).toBeUndefined();

    enum CD {
      C = 'c',
      D = 'd',
    }
    const f = (): void => {
      validateEnum('a', 'b' as string, CD);
    };
    expect(f).toThrow(new Error("`a` must be one of ['c', 'd'], but got 'b'"));
  });
});
