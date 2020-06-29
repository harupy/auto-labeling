import { extractLabels, getName, getChecked } from '../src/main';

describe('main', (): void => {
  it(extractLabels.name, (): void => {
    const body = [
      '- [] `a`: a',
      '- [ ] `b`: b',
      '- [x] `c`: c',
      '- [ x] `d`: d]',
      '- [X] `e`: e]',
      '- [ X] `f`: f]',
    ].join('\n');
    const labelPattern = '- \\[([ xX]*)\\] ?`(.+?)`';
    expect(extractLabels(body, labelPattern)).toEqual([
      { name: 'a', checked: false },
      { name: 'b', checked: false },
      { name: 'c', checked: true },
      { name: 'd', checked: true },
      { name: 'e', checked: true },
      { name: 'f', checked: true },
    ]);
  });

  it(getName.name, (): void => {
    expect(getName({ name: 'a' })).toEqual('a');
  });

  it(getChecked.name, (): void => {
    expect(getChecked({ checked: true })).toEqual(true);
  });
});
