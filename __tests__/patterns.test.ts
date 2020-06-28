import { BACKTICK, COLON, ASTERISK, DOUBLE_ASTERISK } from '../src/patterns';

function testPatterns(
  pattern: string,
  testCases: { [key: string]: string[] },
): void {
  const regexp = new RegExp(pattern);

  for (const [label, [state, name]] of Object.entries(testCases)) {
    const m = regexp.exec(label);

    // Required to suppress the typescript error: "Object is possibly 'null'"
    if (m === null) {
      return;
    }

    expect(m[1]).toEqual(state);
    expect(m[2]).toEqual(name);
  }
}

describe('patterns', (): void => {
  it('backtick', (): void => {
    const testCases = {
      '- [] `abc`': ['', 'abc'],
      '- [ ] `abc`': [' ', 'abc'],
      '- [  ] `abc`': ['  ', 'abc'],
      '- [x] `abc`': ['x', 'abc'],
      '- [ x] `abc`': [' x', 'abc'],
      '- [x ] `abc`': ['x ', 'abc'],
      '- [ x ] `abc`': [' x ', 'abc'],
    };

    testPatterns(BACKTICK, testCases);
  });

  it('colon', (): void => {
    const testCases = {
      '- [] abc:': ['', 'abc'],
      '- [ ] abc:': [' ', 'abc'],
      '- [  ] abc:': ['  ', 'abc'],
      '- [x] abc:': ['x', 'abc'],
      '- [ x] abc:': [' x', 'abc'],
      '- [x ] abc:': ['x ', 'abc'],
      '- [ x ] abc:': [' x ', 'abc'],
    };

    testPatterns(COLON, testCases);
  });

  it('asterisk', (): void => {
    const testCases = {
      '- [] *abc*': ['', 'abc'],
      '- [ ] *abc*': [' ', 'abc'],
      '- [  ] *abc*': ['  ', 'abc'],
      '- [x] *abc*': ['x', 'abc'],
      '- [ x] *abc*': [' x', 'abc'],
      '- [x ] *abc*': ['x ', 'abc'],
      '- [ x ] *abc*': [' x ', 'abc'],
    };

    testPatterns(ASTERISK, testCases);
  });

  it('double asterisk', (): void => {
    const testCases = {
      '- [] **abc***': ['', 'abc'],
      '- [ ] **abc**': [' ', 'abc'],
      '- [  ] **abc**': ['  ', 'abc'],
      '- [x] **abc**': ['x', 'abc'],
      '- [ x] **abc**': [' x', 'abc'],
      '- [x ] **abc**': ['x ', 'abc'],
      '- [ x ] **abc**': [' x ', 'abc'],
    };

    testPatterns(DOUBLE_ASTERISK, testCases);
  });
});
