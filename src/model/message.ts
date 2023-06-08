export enum MessageType {
    PRIVATE = 'private',
    GROUP = 'group'
}

export interface Message {
    message_id: number,
    from: {
        id: number, // user id
        is_bot: boolean,
        first_name: string,
        language_code: string,
        username: string,
    },
    chat: {
        id: number, // chat id
        first_name: string,
        title: string, //group name
        username: string,
        type: MessageType,
    },
    reply_to_message?: {
        message_id: number,
    },
    date: number,
    text: string,
    photo:    {
        file_id: string,
        file_unique_id: string,
        file_size: number,
        width: number,
        height: number,
    }[],
    entities?: any[],
}