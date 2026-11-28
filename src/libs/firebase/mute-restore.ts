import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore/lite';
import { db } from 'libs/firebase/firebase';

// Time when a mute should be restored to text-only permissions.
export interface MuteRestore {
  chatId: number,
  userId: number,
  restoreAt: number // ms
}

const restoreCollectionRef = collection(db, 'mute_restores');
const restoreRef = (chatId: number, userId: number) => doc(restoreCollectionRef, `${chatId}_${userId}`);

export const recordMute = async (chatId: number, userId: number, restoreAt: number) => {
  const ref = restoreRef(chatId, userId);
  // Replace any older restore doc so stale pre-mute permissions are discarded.
  const restore: MuteRestore = { chatId, userId, restoreAt };
  await setDoc(ref, restore);
};

export const takeDueMuteRestores = async () => {
  const snapshot = await getDocs(query(restoreCollectionRef, where('restoreAt', '<=', Date.now())));
  return snapshot.docs.map((snap) => ({ restore: snap.data() as MuteRestore, done: () => deleteDoc(snap.ref) }));
};

export const clearMuteRestore = (chatId: number, userId: number) => deleteDoc(restoreRef(chatId, userId));
