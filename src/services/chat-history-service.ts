import {
  collection, doc, getDocs, limit, orderBy, query, setDoc
} from 'firebase/firestore';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { ChatMessage } from 'models';
import { convertFirebaseMessageToChatMessage, getChatHistoryKey } from 'utils';
import { writeBatch } from '@firebase/firestore';
import { MESSAGE_LIMIT } from 'const/settings';

export const chatHistoryMap: Map<string, ChatMessage[]> = new Map();

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
  chatHistory.push(msg);
  chatHistoryMap.set(historyId, chatHistory);
};

export const resetChatHistory = async (chatId: number, mode: string) => {
  const historyId = getChatHistoryKey(chatId, mode);
  chatHistoryMap.set(historyId, []);
  const messageCollectionRef = collection(db, collectionName.chat_history, historyId, collectionName.message);
  const docSnap = await getDocs(messageCollectionRef);
  const batch = writeBatch(db);
  docSnap.forEach((msg) => {
    const messageRef = doc(db, collectionName.chat_history, historyId, collectionName.message, msg.id);
    batch.delete(messageRef);
  });
  await batch.commit();
};
