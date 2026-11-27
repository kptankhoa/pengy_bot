import { Message } from 'models/message';
import { onIncomingMessage } from './chat-message-handler';
import { onResetMessage } from './reset-message-handler';
import { onImageMessage } from './image-message-handler';
import { onNewsMessage } from './news-message-handler';
import { onWeatherMessage } from './weather-message-handler';
import { onDictionaryMessage } from './dictionary-message-handler';
import { onFundMessage } from './fund-message-handler';
import { onNoteMessage } from './note-message-handler';
import { onSearchMessage } from './search-message-handler';
import { onPriceMessage } from './price-message-handler';
import { onChatInfoMessage } from './chat-info-message-handler';
import { onBanWordMessage } from './ban-word-message-handler';
import { onHelpMessage } from './help-message-handler';
import { BOT_COMMAND } from 'const/chat';
import { onBlocklistMessage } from './blocklist-message-handler';

type TextMessageHandler = (bot: any, msg: Message) => unknown;

// Keep command matching and handler selection together so new text commands have one clear entry point.
const textCommandHandlers: Array<[RegExp, TextMessageHandler]> = [
  [BOT_COMMAND.HELP, onHelpMessage],
  [BOT_COMMAND.RESET, onResetMessage],
  [BOT_COMMAND.IMAGE, onImageMessage],
  [BOT_COMMAND.WEATHER, onWeatherMessage],
  [BOT_COMMAND.NEWS, onNewsMessage],
  [BOT_COMMAND.SEARCH, onSearchMessage],
  [BOT_COMMAND.DICT, onDictionaryMessage],
  [BOT_COMMAND.FUND, onFundMessage],
  [BOT_COMMAND.PRICE, onPriceMessage],
  [BOT_COMMAND.CHAT_INFO, onChatInfoMessage],
  [BOT_COMMAND.NOTE, onNoteMessage],
  [BOT_COMMAND.BAN_WORD, onBanWordMessage],
  [BOT_COMMAND.BLOCKLIST, onBlocklistMessage],
];

export const handleTextMessage = (bot: any, msg: Message) => {
  const commandHandler = textCommandHandlers.find(([command]) => command.test(msg.text));
  return commandHandler ? commandHandler[1](bot, msg) : onIncomingMessage(bot, msg);
};
