import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { collectionName } from 'const/firebase/collection-name';
import { DictWord } from 'model/dict-word';
import { db } from 'lib/firebase';

const dictRef = collection(db, collectionName.dictionary);

const dictionaryMap = new Map<string, DictWord>();

onSnapshot(dictRef, (querySnapshot) => {
  dictionaryMap.clear();
  querySnapshot.forEach((doc) => {
    dictionaryMap.set(doc.id, doc.data() as DictWord);
  });
});

export const getDictionary = () => {
  return Array.from(dictionaryMap.values());
};

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
