import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getBotReplyIdKey } from 'utils';
import { botReplyIdMap, lastInteractionModeMap } from 'const/chat';

export const getLastInteractionMode = async (chatId: number): Promise<string | null> => {
  const key = chatId.toString();
  const savedMode = lastInteractionModeMap.get(key);
  if (savedMode) {
    return savedMode;
  }
  console.info(`fetch last interaction mode for ${key}`);
  const lastInteractionModeDocRef = doc(db, collectionName.last_interaction_mode, key);
  const docSnap = await getDoc(lastInteractionModeDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data().mode;
    lastInteractionModeMap.set(key, data);
    return data;
  }
  return null;
};

export const getBotReplyIdMode = async (chatId: number, messageId: number): Promise<string | null> => {
  const key = getBotReplyIdKey(chatId, messageId);
  const savedMode = botReplyIdMap.get(key);
  if (savedMode) {
    return savedMode;
  }
  console.info(`fetch bot reply id mode for ${key}`);
  const botReplyIdDocRef = doc(db, collectionName.bot_reply_id_mode, key);
  const docSnap = await getDoc(botReplyIdDocRef);
  if (docSnap.exists()) {
    const data = docSnap.data().mode;
    botReplyIdMap.set(key, data);
    return data;
  }
  return null;
};

export const setLastInteractionMode = async (chatId: number, mode: string): Promise<void> => {
  const key = chatId.toString();
  const lastInteractionModeDocRef = doc(db, collectionName.last_interaction_mode, key);
  await setDoc(lastInteractionModeDocRef, { mode });
  lastInteractionModeMap.set(key, mode);
};

export const setBotReplyIdMode = async (chatId: number, messageId: number, mode: string): Promise<void> => {
  const key = getBotReplyIdKey(chatId, messageId);
  const botReplyIdDocRef = doc(db, collectionName.bot_reply_id_mode, key);
  await setDoc(botReplyIdDocRef, { mode });
  botReplyIdMap.set(key, mode);
};
