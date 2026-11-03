import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { getBotReplyIdKey } from 'utils';

export const getLastInteractionMode = async (chatId: number): Promise<string | null> => {
  const key = chatId.toString();
  console.info(`fetch last interaction mode for ${key}`);
  const lastInteractionModeDocRef = doc(db, collectionName.last_interaction_mode, key);
  const docSnap = await getDoc(lastInteractionModeDocRef);
  if (docSnap.exists()) {
    return docSnap.data().mode;
  }
  return null;
};

export const getBotReplyIdMode = async (chatId: number, messageId: number): Promise<string | null> => {
  const key = getBotReplyIdKey(chatId, messageId);
  console.info(`fetch bot reply id mode for ${key}`);
  const botReplyIdDocRef = doc(db, collectionName.bot_reply_id_mode, key);
  const docSnap = await getDoc(botReplyIdDocRef);
  if (docSnap.exists()) {
    return docSnap.data().mode;
  }
  return null;
};

export const setLastInteractionMode = async (chatId: number, mode: string): Promise<void> => {
  const key = chatId.toString();
  const lastInteractionModeDocRef = doc(db, collectionName.last_interaction_mode, key);
  await setDoc(lastInteractionModeDocRef, { mode });
};

export const setBotReplyIdMode = async (chatId: number, messageId: number, mode: string): Promise<void> => {
  const key = getBotReplyIdKey(chatId, messageId);
  const botReplyIdDocRef = doc(db, collectionName.bot_reply_id_mode, key);
  await setDoc(botReplyIdDocRef, { mode });
};
