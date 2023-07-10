import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { Dictionary, DictWord } from 'models';
import { dictionaryMap } from 'const/chat';

export const getDictionary = async (chatId: number): Promise<Dictionary> => {
  const key = chatId.toString();
  const dictionary = dictionaryMap.get(key);
  if (dictionary) {
    return dictionary;
  }

  const dictRef = collection(db, collectionName.dictionary, key, collectionName.dictionary);
  await onSnapshot(dictRef, (querySnapshot) => {
    const newDictMap = new Map<string, DictWord>();
    console.info(`fetch dictionary for ${key}`);
    querySnapshot.forEach((doc) => {
      newDictMap.set(doc.id, doc.data() as DictWord);
    });
    dictionaryMap.set(key, newDictMap);
  });
  const snapshot = await getDocs(dictRef);
  const newDictMap = new Map<string, DictWord>();
  snapshot.forEach((doc) => {
    newDictMap.set(doc.id, doc.data() as DictWord);
  });
  return newDictMap;
};

export const findWord = async (chatId: number, word: string): Promise<DictWord[] | null> => {
  const dictionary = dictionaryMap.get(chatId.toString());
  if (!dictionary) {
    return null;
  }
  const foundKeys = Array.from(dictionary.keys())
    .filter((key) => key.toLowerCase().includes(word.toLowerCase()));
  if (!foundKeys.length) {
    return null;
  }
  return foundKeys.map((key) => dictionary.get(key)) as DictWord[];
};

export const createWord = async (chatId: number, word: DictWord) => {
  const docRef = doc(db, collectionName.dictionary, chatId.toString(), collectionName.dictionary, word.word);
  await setDoc(docRef, word);
};

export const removeWord = async (chatId: number, word: string)=> {
  await deleteDoc(doc(db, collectionName.dictionary, chatId.toString(), collectionName.dictionary, word));
};
