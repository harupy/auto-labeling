import {
  formatStrArray,
  validateEnum,
  parseOffsetString,
  getOffsetDate,
} from '../src/utils';
import { OffsetUnits } from '../src/enums';

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

  it(parseOffsetString.name, () => {
    expect(parseOffsetString('1M')).toEqual([1, 'M']);
    expect(parseOffsetString('12M')).toEqual([12, 'M']);

    expect(() => parseOffsetString('M')).toThrow(Error);
    expect(() => parseOffsetString('12')).toThrow(Error);
    expect(() => parseOffsetString('1MM')).toThrow(Error);
    expect(() => parseOffsetString('M1M')).toThrow(Error);
    expect(() => parseOffsetString('1M1')).toThrow(Error);
  });

  it(getOffsetDate.name, () => {
    const date = new Date('2020-10-10T10:10:10.000Z');

    expect(getOffsetDate(date, 1, OffsetUnits.HOUR)).toEqual(
      new Date('2020-10-10T09:10:10.000Z'),
    );

    expect(getOffsetDate(date, 1, OffsetUnits.DAY)).toEqual(
      new Date('2020-10-09T10:10:10.000Z'),
    );

    expect(getOffsetDate(date, 1, OffsetUnits.MONTH)).toEqual(
      new Date('2020-09-10T10:10:10.000Z'),
    );
  });
});
