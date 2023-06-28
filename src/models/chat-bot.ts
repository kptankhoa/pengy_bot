export interface ChatBot {
  systemGuide: string;
  postfix: string;
  key: string;
  name?: string;
  tokens?: number;
}