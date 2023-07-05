import { doc, onSnapshot } from 'firebase/firestore';
import { collectionName, FirebaseRemoteConfig, remoteConfigKey } from 'const/firebase';
import { db } from './firebase';

const configDocKey = 'config';

const configDocRef = doc(db, collectionName.other_config, configDocKey);

const configMap = new Map<remoteConfigKey, any>();

onSnapshot(configDocRef, (config) => {
  console.info('fetch config');
  configMap.clear();
  Object.entries(config.data() as FirebaseRemoteConfig)
    .map(([key, value]) => configMap.set(key as remoteConfigKey, value));
});

export const extraVocabModes = (): string[] => configMap.get('extraVocabModes') || [];

export const useExtraVocab = (): boolean => configMap.get('useExtraVocab') || false;
