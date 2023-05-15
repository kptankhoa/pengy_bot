export enum MessageType {
    PRIVATE = 'private'
}

export interface Message {
    message_id: number;
    from: {
        id: number; // user id
        is_bot: boolean;
        first_name: string;
        language_code: string;
        username: string;
    };
    chat: {
        id: number; // chat id
        first_name: string;
        title: string; //group name
        username: string;
        type: MessageType;
    },
    date: number;
    text: string;
    entities?: any[];
}