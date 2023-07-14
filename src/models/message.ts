export enum MessageType {
    PRIVATE = 'private',
    GROUP = 'group'
}

export interface Message {
    message_id: number,
    from: {
        first_name: string;
        username: string,
    },
    chat: {
        id: number, // chat id
        title: string, //group name
        username: string,
        type: MessageType,
    },
    reply_to_message?: {
        message_id: number,
    },
    text: string,
    photo: {
        file_id: string,
        file_unique_id: string,
        file_size: number,
        width: number,
        height: number,
    }[],
    entities?: any[],
}
