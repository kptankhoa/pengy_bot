import { collection, onSnapshot } from 'firebase/firestore';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { ChatBot, ChatMode } from 'models';
import { defaultBot } from 'const/chat';

const chatBotRef = collection(db, collectionName.chat_bot);

const chatBotMap = new Map<string, ChatBot>();

onSnapshot(chatBotRef, (querySnapshot) => {
  console.info('fetch chatbots');
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