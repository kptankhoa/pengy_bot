import {
  collection, doc, getCountFromServer, getDocs, limit, orderBy, query, setDoc
} from 'firebase/firestore';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { ChatMessage } from 'models';
import { convertFirebaseMessageToChatMessage, getChatHistoryKey } from 'utils';
import { writeBatch } from '@firebase/firestore';
import { MESSAGE_LIMIT } from 'const/settings';
import { chatHistoryMap } from 'const/chat';

export const getChatHistory = async (chatId: number, mode: string): Promise<ChatMessage[]>  => {
  const historyId = getChatHistoryKey(chatId, mode);
  const chatHistory = chatHistoryMap.get(historyId);
  if (chatHistory) {
    return chatHistory;
  }
  console.info(`fetch history for ${historyId}`);
  const messageCollectionRef = collection(db, collectionName.chat_history, historyId, collectionName.message);
  const q = query(messageCollectionRef, orderBy('updatedAt', 'desc'), limit(MESSAGE_LIMIT));
  const docSnap = await getDocs(q);
  const newChatHistory: ChatMessage[] = [];
  docSnap.forEach((msg) => newChatHistory.push(convertFirebaseMessageToChatMessage(msg.data())));
  newChatHistory.reverse();
  chatHistoryMap.set(historyId, newChatHistory);
  return newChatHistory;
};

export const addNewMessage = async (chatId: number, mode: string, msgId: number, msg: ChatMessage, timestamp: number) => {
  const historyId = getChatHistoryKey(chatId, mode);
  const chatHistory = chatHistoryMap.get(historyId) || [];
  const messageRef = doc(db, collectionName.chat_history, historyId, collectionName.message, msgId.toString());
  const historyRef = doc(db, collectionName.chat_history, historyId);
  await setDoc(messageRef, { ...msg, updatedAt: timestamp });
  await setDoc(historyRef, { updatedAt: timestamp });
  const newChatHistory: ChatMessage[] = [...chatHistory.splice(chatHistory.length - MESSAGE_LIMIT + 1), msg];
  chatHistoryMap.set(historyId, newChatHistory);
};

export const resetChatHistory = async (chatId: number, mode: string) => {
  const historyId = getChatHistoryKey(chatId, mode);
  chatHistoryMap.set(historyId, []);
  const messageCollectionRef = collection(db, collectionName.chat_history, historyId, collectionName.message);
  const countSnapshot = await getCountFromServer(messageCollectionRef);
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
