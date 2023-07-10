export interface DictWord {
    word: string;
    wordType: string;
    meaning: string;
    type?: string;
    synonym?: string[];
}

export type Dictionary = Map<string, DictWord>;
