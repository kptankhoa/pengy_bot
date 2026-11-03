import {
  collection, doc, getCount, getDocs, limit, orderBy, query, setDoc, writeBatch
} from 'firebase/firestore/lite';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { ChatMessage } from 'models';
import { convertFirebaseMessageToChatMessage, getChatHistoryKey } from 'utils';
import { MESSAGE_LIMIT } from 'const/settings';

export const getChatHistory = async (chatId: number, mode: string): Promise<ChatMessage[]>  => {
  const historyId = getChatHistoryKey(chatId, mode);
  console.info(`fetch history for ${historyId}`);
  const messageCollectionRef = collection(db, collectionName.chat_history, historyId, collectionName.message);
  const q = query(messageCollectionRef, orderBy('updatedAt', 'desc'), limit(MESSAGE_LIMIT));
  const docSnap = await getDocs(q);
  const newChatHistory: ChatMessage[] = [];
  docSnap.forEach((msg) => newChatHistory.push(convertFirebaseMessageToChatMessage(msg.data())));
  newChatHistory.reverse();
  return newChatHistory;
};

export const addNewMessage = async (chatId: number, mode: string, msgId: number, msg: ChatMessage, timestamp: number) => {
  const historyId = getChatHistoryKey(chatId, mode);
  const messageRef = doc(db, collectionName.chat_history, historyId, collectionName.message, msgId.toString());
  const historyRef = doc(db, collectionName.chat_history, historyId);
  await Promise.all([
    setDoc(messageRef, { ...msg, updatedAt: timestamp }),
    setDoc(historyRef, { updatedAt: timestamp })
  ]);
};

export const resetChatHistory = async (chatId: number, mode: string) => {
  const historyId = getChatHistoryKey(chatId, mode);
  const messageCollectionRef = collection(db, collectionName.chat_history, historyId, collectionName.message);
  const countSnapshot = await getCount(messageCollectionRef);
  const docCount = countSnapshot.data().count;
  let deletedDocs = 0;
  while (deletedDocs < docCount) {
    const q = query(messageCollectionRef, limit(500));
    const docSnap = await getDocs(q);
    const batch = writeBatch(db);
    docSnap.forEach((msg) => {
      const messageRef = doc(db, collectionName.chat_history, historyId, collectionName.message, msg.id);
      batch.delete(messageRef);
    });
    deletedDocs+=docSnap.size;
    await batch.commit();
  }
};
