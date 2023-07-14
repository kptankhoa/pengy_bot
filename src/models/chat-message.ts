export enum RoleEnum {
    USER = 'user',
    ASSISTANT = 'assistant',
    SYSTEM = 'system'
}

export interface ChatMessage {
    role: RoleEnum,
    content: string;
    name: string;
    updatedAt?: number;
}
