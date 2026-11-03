import { collection, getDocs } from 'firebase/firestore/lite';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { ChatBot, ChatMode } from 'models';
import { chatBotMap, defaultBot } from 'const/chat';
import { cached } from 'utils/cache-util';

const chatBotRef = collection(db, collectionName.chat_bot);

export const loadChatBots = cached(async () => {
  console.info('fetch chatbots');
  const querySnapshot = await getDocs(chatBotRef);
  chatBotMap.clear();
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    chatBotMap.set(doc.id, { id: doc.id, ...data, name: data.name || doc.id } as ChatBot);
  });
});

export const getChatBot = (key: string): ChatBot => {
  return chatBotMap.get(key) || defaultBot;
};

export const getChatBotRegEx = (key: string) => {
  const bot: ChatBot = getChatBot(key);
  return new RegExp(`^/${bot.key} +`);
};

export const chatModes = (): ChatMode[] => Array.from(chatBotMap.keys())
  .map((key) => ({
    mode: key,
    command: getChatBotRegEx(key)
  }));

export const resetMap = (): { [key: string]: string } => Array.from(chatBotMap.entries())
  .map(([mode, { key }]) => ({ mode, key }))
  .reduce((prev, { mode, key }) => ({ ...prev, [key]: mode }), {});
