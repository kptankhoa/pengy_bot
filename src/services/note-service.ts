import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from 'libs/firebase';
import { collectionName } from 'const/firebase';
import { Note } from 'models';

export const getAllNotes = async (chatId: number): Promise<Note[]> => {
  console.info(`fetch notes for ${chatId}`);
  const noteByChatIdDocRef = doc(db, collectionName.note, chatId.toString());
  const docSnap = await getDoc(noteByChatIdDocRef);
  if (docSnap.exists()) {
    return docSnap.data().notes as Note[];
  }

  return [];
};

export const addNewNote = async (chatId: number, note: Note): Promise<void> => {
  const chatNotes = await getAllNotes(chatId);
  const newNotes = [...chatNotes, note];
  const noteByChatIdDocRef = doc(db, collectionName.note, chatId.toString());
  await setDoc(noteByChatIdDocRef, { notes: newNotes });
};

export const deleteNodeByIndex = async (chatId: number, index: number): Promise<void> => {
  const chatNotes = await getAllNotes(chatId);
  const newNotes = chatNotes.filter((_, idx) => idx !== index);
  const noteByChatIdDocRef = doc(db, collectionName.note, chatId.toString());
  await setDoc(noteByChatIdDocRef, { notes: newNotes });
};
