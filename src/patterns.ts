export const BACKTICK = '- \\[(.*?)\\] ?`(.+?)`'; // matches "- [ ] `abc` ..."
export const COLON = '- \\[(.*?)\\] ?(.+?):'; // matches "- [ ] abc: ..."
export const ASTERISK = '- \\[(.*?)\\] ?\\*(.+?)\\*'; // matches "- [ ] *abc* ..."
export const DOUBLE_ASTERISK = '- \\[(.*?)\\] ?\\*\\*(.+?)\\*\\*'; // matches "- [ ] **abc** ..."
