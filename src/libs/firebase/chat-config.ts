import { collection, doc, getDocs, setDoc } from 'firebase/firestore/lite';
import { collectionName, FirebaseRemoteConfig } from 'const/firebase';
import { cached } from 'utils/cache-util';
import { db } from './firebase';

const configCollectionRef = collection(db, collectionName.chat_config);

const configMap = new Map<string, FirebaseRemoteConfig>();

const defaultConfig: FirebaseRemoteConfig = {
  extraVocabModes: ['pengy', 'story', 'content'],
  useExtraVocab: true
};

export const loadChatConfigs = cached(async () => {
  console.info('fetch chat configs');
  const snapshot = await getDocs(configCollectionRef);
  configMap.clear();
  snapshot.forEach((doc) => {
    configMap.set(doc.id, doc.data() as FirebaseRemoteConfig);
  });
});

export const ensureChatConfig = async (chatId: number) => {
  if (configMap.has(chatId.toString())) {
    return;
  }
  configMap.set(chatId.toString(), defaultConfig);
  await setDoc(doc(db, collectionName.chat_config, chatId.toString()), defaultConfig);
};

export const extraVocabModes = (chatId: number): string[] =>
  (configMap.get(chatId.toString()) || defaultConfig).extraVocabModes;

export const useExtraVocab = (chatId: number): boolean =>
  (configMap.get(chatId.toString()) || defaultConfig).useExtraVocab;
