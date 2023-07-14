import { doc, onSnapshot } from 'firebase/firestore';
import { collectionName, FirebaseRemoteConfig } from 'const/firebase';
import { db } from './firebase';

const configDocKey = 'config';

const configDocRef = doc(db, collectionName.other_config, configDocKey);

const configMap = new Map<string, any>();

onSnapshot(configDocRef, (config) => {
  console.info('fetch other configs');
  configMap.clear();
  Object.entries(config.data() as FirebaseRemoteConfig)
    .map(([key, value]) => configMap.set(key, value));
});

export const getBingImageToken = (): string => configMap.get('bingImageToken') || [];
