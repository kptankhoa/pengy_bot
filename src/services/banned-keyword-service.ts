import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { collectionName } from 'const/firebase';
import { db } from 'libs/firebase';
import { cached } from 'utils/cache-util';

const bannedKeywordsDoc = doc(db, collectionName.other_config, collectionName.banned_keywords);
let bannedKeywords: string[] = [];

const loadBannedKeywords = cached(async () => {
  const snapshot = await getDoc(bannedKeywordsDoc);
  const storedKeywords = snapshot.exists() ? snapshot.data().keywords : [];
  bannedKeywords = Array.isArray(storedKeywords)
    ? [...new Set(storedKeywords.filter((keyword): keyword is string => typeof keyword === 'string').map(keyword => keyword.trim().toLowerCase()).filter(Boolean))]
    : [];
});

export const getBannedKeywords = async (): Promise<string[]> => {
  await loadBannedKeywords();
  return [...bannedKeywords];
};

export const addBannedKeyword = async (keyword: string): Promise<boolean> => {
  await loadBannedKeywords();
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword || bannedKeywords.includes(normalizedKeyword)) {
    return false;
  }

  const updatedKeywords = [...bannedKeywords, normalizedKeyword];
  await setDoc(bannedKeywordsDoc, { keywords: updatedKeywords });
  bannedKeywords = updatedKeywords;
  return true;
};

export const removeBannedKeyword = async (keyword: string): Promise<boolean> => {
  await loadBannedKeywords();
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!bannedKeywords.includes(normalizedKeyword)) {
    return false;
  }

  const updatedKeywords = bannedKeywords.filter(item => item !== normalizedKeyword);
  await setDoc(bannedKeywordsDoc, { keywords: updatedKeywords });
  bannedKeywords = updatedKeywords;
  return true;
};
