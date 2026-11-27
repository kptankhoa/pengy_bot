import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore/lite';
import { db } from 'libs/firebase/firebase';

// Users get text-only permissions when a timed mute expires.
export interface MuteRestore {
  chatId: number,
  userId: number,
  restoreAt: number // ms
}

const restoreCollectionRef = collection(db, 'mute_restores');

export const recordMute = async (chatId: number, userId: number, restoreAt: number) => {
  const ref = doc(restoreCollectionRef, `${chatId}_${userId}`);
  if ((await getDoc(ref)).exists()) {
    return updateDoc(ref, { restoreAt });
  }
  const restore: MuteRestore = { chatId, userId, restoreAt };
  return setDoc(ref, restore);
};

export const takeDueMuteRestores = async () => {
  const snapshot = await getDocs(query(restoreCollectionRef, where('restoreAt', '<=', Date.now())));
  return snapshot.docs.map((snap) => ({ restore: snap.data() as MuteRestore, done: () => deleteDoc(snap.ref) }));
};

export const clearMuteRestore = (chatId: number, userId: number) =>
  deleteDoc(doc(restoreCollectionRef, `${chatId}_${userId}`));
