import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { DictWord } from 'models';
import { dictionaryMap } from "const/chat";

const dictRef = collection(db, collectionName.dictionary);

onSnapshot(dictRef, (querySnapshot) => {
  console.info('fetch dictionary');
  dictionaryMap.clear();
  querySnapshot.forEach((doc) => {
    dictionaryMap.set(doc.id, doc.data() as DictWord);
  });
});

export const getDictionary = () => Array
  .from(dictionaryMap.values())
  .sort((a, b) => a.word.localeCompare(b.word));

export const findWord = (word: string): DictWord[] | null => {
  const foundKeys = Array.from(dictionaryMap.keys())
    .filter((key) => key.toLowerCase().includes(word.toLowerCase()));
  if (!foundKeys.length) {
    return null;
  }
  return foundKeys.map((key) => dictionaryMap.get(key)) as DictWord[];
};

export const createWord = async (word: DictWord) => {
  const docRef = doc(db, collectionName.dictionary, word.word);
  await setDoc(docRef, word);
};

export const removeWord = async (word: string)=> {
  await deleteDoc(doc(db, collectionName.dictionary, word));
};
