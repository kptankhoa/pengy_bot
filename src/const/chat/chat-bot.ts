import { ChatBot } from 'models';

export enum ChatModeEnum {
  no_reply = 'no_reply',
  pengy = 'pengy',
  dev = 'dev',
  story = 'story',
  news = 'news',
  compose = 'compose',
  translator = 'translator',
  google = 'google',
  steven = 'steven',
  khoa = 'khoa',
  content = 'content',
  empty = 'empty',
}

export const defaultBot: ChatBot = {
  systemGuide: '',
  postfix: '',
  key: '',
};
