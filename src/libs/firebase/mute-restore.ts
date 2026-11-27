import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore/lite';
import { db } from 'libs/firebase/firebase';

// Per-user restrictions a keyword mute overwrote, re-applied by the minute cron once the mute ends.
export interface MuteRestore {
  chatId: number,
  userId: number,
  permissions: Record<string, boolean>,
  untilDate: number, // original restriction end (unix seconds), 0 = forever
  restoreAt: number // ms
}

const restoreCollectionRef = collection(db, 'mute_restores');

// member is Telegram's ChatMember from before the mute
export const recordMute = async (chatId: number, userId: number, member: Record<string, any>, restoreAt: number) => {
  const ref = doc(restoreCollectionRef, `${chatId}_${userId}`);
  // Muted again before restore: current permissions are the mute itself, so keep the saved originals
  if ((await getDoc(ref)).exists()) {
    return updateDoc(ref, { restoreAt });
  }
  if (member.status !== 'restricted') {
    return; // plain member: Telegram's own expiry already returns them to group defaults
  }
  const permissions = Object.fromEntries(Object.entries(member).filter(([key]) => key.startsWith('can_')));
  const restore: MuteRestore = { chatId, userId, permissions, untilDate: member.until_date || 0, restoreAt };
  return setDoc(ref, restore);
};

export const takeDueMuteRestores = async () => {
  const snapshot = await getDocs(query(restoreCollectionRef, where('restoreAt', '<=', Date.now())));
  return snapshot.docs.map((snap) => ({ restore: snap.data() as MuteRestore, done: () => deleteDoc(snap.ref) }));
};
