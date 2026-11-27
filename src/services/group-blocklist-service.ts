import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { collectionName } from 'const/firebase';
import { db } from 'libs/firebase';

export interface BlockedMember {
  userId: number;
  name?: string;
  username?: string;
}

const getBlocklistDoc = (chatId: number) => doc(db, collectionName.group_blocklists, String(chatId));
const cache = new Map<number, { expiresAt: number; members: BlockedMember[] }>();

export const getGroupBlocklist = async (chatId: number): Promise<BlockedMember[]> => {
  const cached = cache.get(chatId);
  if (cached && cached.expiresAt > Date.now()) return [...cached.members];
  const snapshot = await getDoc(getBlocklistDoc(chatId));
  const members: unknown = snapshot.exists() ? snapshot.data().members : [];
  if (!Array.isArray(members)) return [];
  const validMembers = members.filter((member): member is BlockedMember =>
    !!member && typeof member === 'object' && Number.isSafeInteger((member as BlockedMember).userId)
  );
  cache.set(chatId, { expiresAt: Date.now() + 30_000, members: validMembers });
  return [...validMembers];
};

export const addGroupBlockedMember = async (chatId: number, member: BlockedMember): Promise<boolean> => {
  const members = await getGroupBlocklist(chatId);
  if (members.some(item => item.userId === member.userId)) return false;
  const updatedMembers = [...members, member];
  await setDoc(getBlocklistDoc(chatId), { members: updatedMembers });
  cache.set(chatId, { expiresAt: Date.now() + 30_000, members: updatedMembers });
  return true;
};

export const removeGroupBlockedMember = async (chatId: number, userId: number): Promise<boolean> => {
  const members = await getGroupBlocklist(chatId);
  const updatedMembers = members.filter(member => member.userId !== userId);
  if (updatedMembers.length === members.length) return false;
  await setDoc(getBlocklistDoc(chatId), { members: updatedMembers });
  cache.set(chatId, { expiresAt: Date.now() + 30_000, members: updatedMembers });
  return true;
};
