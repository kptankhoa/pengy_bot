import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from 'libs/firebase/firebase';
import { collectionName } from 'const/firebase';

const chatIdListDocRef = doc(db, collectionName.other_config, 'chat_id_list');

export const checkChatIdExist = async (chatId: number) => {
  const chatIdList: number[] = (await getDoc(chatIdListDocRef)).data()?.chatIdList || [];
  if (chatIdList.includes(chatId)) {
    return true;
  }
  await setDoc(chatIdListDocRef, { chatIdList: [...chatIdList, chatId] });
  return false;
};
