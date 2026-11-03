import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from 'libs/firebase/firebase';
import { collectionName } from 'const/firebase';

const chatIdListDocRef = doc(db, collectionName.other_config, 'chat_id_list');

// Ids are never removed, so a positive answer can be cached for the isolate's lifetime.
const knownChatIds = new Set<number>();

export const checkChatIdExist = async (chatId: number) => {
  if (knownChatIds.has(chatId)) {
    return true;
  }
  const chatIdList: number[] = (await getDoc(chatIdListDocRef)).data()?.chatIdList || [];
  chatIdList.forEach((id) => knownChatIds.add(id));
  if (chatIdList.includes(chatId)) {
    return true;
  }
  knownChatIds.add(chatId);
  await setDoc(chatIdListDocRef, { chatIdList: [...chatIdList, chatId] });
  return false;
};
