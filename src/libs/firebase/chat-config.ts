import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { collectionName, FirebaseRemoteConfig } from 'const/firebase';
import { db } from './firebase';

const configCollectionRef = collection(db, collectionName.chat_config);

const configMap = new Map<string, FirebaseRemoteConfig>();

const defaultConfig: FirebaseRemoteConfig = {
  extraVocabModes: ['pengy', 'story', 'content'],
  useExtraVocab: true
};

onSnapshot(configCollectionRef, (snapshot) => {
  console.info('fetch chat configs');
  configMap.clear();
  snapshot.forEach((doc) => {
    configMap.set(doc.id, doc.data() as FirebaseRemoteConfig);
  });
});

const setDefaultConfig = async (chatId: number) => {
  configMap.set(chatId.toString(), defaultConfig);
  const docRef = doc(db, collectionName.chat_config, chatId.toString());
  await setDoc(docRef, defaultConfig);
};

export const extraVocabModes = (chatId: number): string[] => {
  const existedConfig = configMap.get(chatId.toString());
  if (existedConfig) {
    return existedConfig.extraVocabModes;
  }
  setDefaultConfig(chatId);
  return defaultConfig.extraVocabModes;
};

export const useExtraVocab = (chatId: number): boolean => {
  const existedConfig = configMap.get(chatId.toString());
  if (existedConfig) {
    return existedConfig.useExtraVocab;
  }
  setDefaultConfig(chatId);
  return defaultConfig.useExtraVocab;
};
