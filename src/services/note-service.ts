import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "libs/firebase";
import { collectionName } from "const/firebase";
import { Note } from "models";
import { noteMap } from "const/chat";

export const getAllNotes = async (chatId: number): Promise<Note[]> => {
    const chatNotes = noteMap.get(chatId.toString());
    if (chatNotes) {
        return chatNotes;
    }
    console.info(`fetch notes for ${chatId}`);
    const noteByChatIdDocRef = doc(db, collectionName.note, chatId.toString());
    const docSnap = await getDoc(noteByChatIdDocRef);
    if (docSnap.exists()) {
        const notes = docSnap.data().notes as Note[];
        noteMap.set(chatId.toString(), notes);
        return notes;
    }

    return [];
};

export const addNewNote = async (chatId: number, note: Note): Promise<void> => {
    const chatNotes = await getAllNotes(chatId);
    const newNotes = [...chatNotes, note];
    const noteByChatIdDocRef = doc(db, collectionName.note, chatId.toString());
    await setDoc(noteByChatIdDocRef, { notes: newNotes });
    noteMap.set(chatId.toString(), newNotes);
};

export const deleteNodeByIndex = async (chatId: number, index: number): Promise<void> => {
    const chatNotes = await getAllNotes(chatId);
    const newNotes = chatNotes.filter((_, idx) => idx !== index);
    console.log({
        index, chatNotes, newNotes
    })

    const noteByChatIdDocRef = doc(db, collectionName.note, chatId.toString());
    await setDoc(noteByChatIdDocRef, { notes: newNotes });
    noteMap.set(chatId.toString(), newNotes);
}