import { Message } from 'models/message';
import { onIncomingMessage } from './chat-message-handler';
import { onResetMessage } from './reset-message-handler';
import { onImageMessage } from './image-message-handler';
import { onNewsMessage } from './news-message-handler';
import { onWeatherMessage } from './weather-message-handler';
import { onDictionaryMessage } from './dictionary-message-handler';

export const getMessageHandler = (bot: any) => ({
  onNewMessage: (msg: Message) => onIncomingMessage(bot, msg),
  onReset: (msg: Message) => onResetMessage(bot, msg),
  onImage: (msg: Message) => onImageMessage(bot, msg),
  onNews: (msg: Message) => onNewsMessage(bot, msg),
  onWeather: (msg: Message) => onWeatherMessage(bot, msg),
  onDictionary: (msg: Message) => onDictionaryMessage(bot, msg),
});
