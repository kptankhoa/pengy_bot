export type remoteConfigKey = 'extraVocabModes' | 'useExtraVocab';

export interface FirebaseRemoteConfig {
  extraVocabModes: string[],
  useExtraVocab: boolean
}
