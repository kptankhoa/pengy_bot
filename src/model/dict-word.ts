export interface DictWord {
    word: string;
    type: 'noun' | 'verb' | 'adj';
    meaning: string;
    synonym?: string[];
}