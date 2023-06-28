import { DictWord } from 'model/dict-word';

const getSynonyms = (synonym: DictWord['synonym']): string =>  synonym?.length ? `\n\t\tTừ đồng nghĩa: ${synonym.join(', ')}.` : '';

export const printWithoutWord = ({ type, meaning, synonym}: DictWord): string => `(${type}): ${meaning}.${synonym?.length ? `Synonyms: ${synonym.join(', ')}` : ''}`;

export const printWord = ({ word, type, meaning, synonym}: DictWord): string => `${word} (${type}): ${meaning}.${getSynonyms(synonym)}`;

export const printWords = (words: DictWord[]): string => words.map((word, index) => `${index + 1}. ${printWord(word)}`).join('\n');