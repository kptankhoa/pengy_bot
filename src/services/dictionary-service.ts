import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore/lite';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { Dictionary, DictWord } from 'models';

export const getDictionary = async (chatId: number): Promise<Dictionary> => {
  const dictRef = collection(db, collectionName.dictionary, chatId.toString(), collectionName.dictionary);
  const snapshot = await getDocs(dictRef);
  const dictionary = new Map<string, DictWord>();
  snapshot.forEach((doc) => {
    dictionary.set(doc.id, doc.data() as DictWord);
  });
  return dictionary;
};

const DICTIONARY_TTL = 60_000;
const dictionaryCache = new Map<number, { expires: number, dictionary: Dictionary }>();

// For the chat prompt only: other callers need fresh data, and a stale vocab list there is harmless.
export const getCachedDictionary = async (chatId: number): Promise<Dictionary> => {
  const hit = dictionaryCache.get(chatId);
  if (hit && hit.expires > Date.now()) {
    return hit.dictionary;
  }
  const dictionary = await getDictionary(chatId);
  dictionaryCache.set(chatId, { expires: Date.now() + DICTIONARY_TTL, dictionary });
  return dictionary;
};

export const findWord = async (chatId: number, word: string): Promise<DictWord[] | null> => {
  const dictionary = await getDictionary(chatId);
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
