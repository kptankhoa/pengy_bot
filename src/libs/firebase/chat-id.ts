import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from 'libs/firebase/firebase';
import { collectionName } from 'const/firebase';

const chatIdDocKey = 'chat_id_list';

const chatIdListDocRef = doc(db, collectionName.other_config, chatIdDocKey);

const chatIdMap = new Map<number, boolean>();

onSnapshot(chatIdListDocRef, (docSnap) => {
  console.info('fetch chat id list');
  chatIdMap.clear();
  const existedList = docSnap.data()?.chatIdList;
  if (existedList) {
    existedList.map((id: number) => chatIdMap.set(id, true));
  }
});

export const checkChatIdExist =  async (chatId: number) => {
  if (chatIdMap.get(chatId)) {
    return true;
  }
  chatIdMap.set(chatId, true);
  const newChatIdList = [...Array.from(chatIdMap.keys())];
  await setDoc(chatIdListDocRef, { chatIdList: newChatIdList });
  return false;
};
