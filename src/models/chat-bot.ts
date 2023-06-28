export interface ChatBot {
  id: string;
  systemGuide: string;
  postfix: string;
  key: string;
  name?: string;
  tokens?: number;
}