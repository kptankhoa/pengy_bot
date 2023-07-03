import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { Fund, FundLog } from 'models';
import { FUND_LOG_LIMIT } from 'const/settings';

export const getAllFunds = async (chatId: number): Promise<Fund[]> => {
  const fundRef = collection(db, collectionName.fund_by_chat, chatId.toString(), collectionName.fund);
  const docSnap = await getDocs(fundRef);
  const fundData: Fund[] = [];
  docSnap.forEach((fundDoc) => {
    fundData.push(fundDoc.data() as Fund);
  });

  return fundData;
};

export const getFundByName = async (chatId: number, fundName: string): Promise<Fund | null> => {
  const fundDocRef = doc(db, collectionName.fund_by_chat, chatId.toString(), collectionName.fund, fundName);
  const docSnap = await getDoc(fundDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as Fund;
  }

  return null;
};

export const getFundLogByName = async (chatId: number, fundName: string): Promise<FundLog[]> => {
  const fundLogRef = collection(db, collectionName.fund_by_chat, chatId.toString(), collectionName.fund, fundName, collectionName.fund_log);
  const q = query(fundLogRef, orderBy('updatedAt', 'desc'), limit(FUND_LOG_LIMIT));
  const docSnap = await getDocs(q);
  const fundLogData: FundLog[] = [];
  docSnap.forEach((logDoc) => {
    fundLogData.push(logDoc.data() as FundLog);
  });

  return fundLogData;
};

export const updateFundByName = async (chatId: number, fundName: string, newFundLog: FundLog) => {
  const fundRef = doc(db, collectionName.fund_by_chat, chatId.toString(), collectionName.fund, fundName);
  const fundLogRef = doc(db, collectionName.fund_by_chat, chatId.toString(), collectionName.fund, fundName, collectionName.fund_log, newFundLog.updatedAt.toString());
  await setDoc(fundRef, { name: fundName, ...newFundLog } as Fund);
  await setDoc(fundLogRef, newFundLog);
};