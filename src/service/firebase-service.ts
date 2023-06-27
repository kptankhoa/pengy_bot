import { initializeApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";
import { firebaseConfig } from "../const/settings/firebase-config";
import { collectionName } from "../const/firebase/collection-name";
import { DictWord } from "../model/dict-word";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const dictRef = collection(db, collectionName.dictionary);

export const getDictionary = async () => {
    const wordList: DictWord[] = []
    const querySnapshot = await getDocs(dictRef);
    querySnapshot.forEach((doc) => {
        wordList.push(doc.data() as DictWord);
    });

    return wordList;
};

export const findWord = async (word: string) => {
    const docRef = doc(db, collectionName.dictionary, word);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as DictWord;
    } else {
        return null;
    }
}