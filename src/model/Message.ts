export enum MessageType {
    PRIVATE = 'private'
}

export interface Message {
    message_id: number;
    from: {
        id: string; // chat id
        is_bot: boolean;
        first_name: string;
        language_code: string;
    };
    chat: {
        id: string; // chat id
        first_name: string;
        username: string;
        type: MessageType;
    },
    date: number;
    text: string;
    entities?: any[];
}