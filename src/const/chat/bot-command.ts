export const BOT_COMMAND = {
  RESET: new RegExp('^/z'),
  IMAGE: new RegExp('^/i +'),
  WEATHER: new RegExp('^/b +'),
  NEWS: new RegExp('^/n +'),
  SEARCH: new RegExp('^/search(?:@[\\w_]+)?(?:\\s+|$)'),
  DICT: new RegExp('^/dict'),
  FUND: new RegExp('^/fund'),
  NOTE: new RegExp('^/note'),
};
