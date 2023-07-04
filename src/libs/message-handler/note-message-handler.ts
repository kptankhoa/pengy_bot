import { commandMapping, noteUsage } from 'const/firebase';
import { Message, Note } from 'models';
import { BOT_COMMAND } from 'const/chat';
import { addNewNote, deleteNodeByIndex, getAllNotes } from 'services';
import { printNotes } from 'utils';
import { getNotePrompt } from 'const/prompts';
import { handleChatMessage } from 'libs/message-handler/handle-text-message';

const getHelp = () => {
  const description = 'Pengy note: just because you cannot remember';
  const usageLine = 'USAGE: `/note [command] [options?]` or `/note [your request]`';
  const commandListLine = 'Command list:';
  const usage = Object.entries(noteUsage)
    .filter(([, usage]) => !!usage)
    .map(([key, usage]) => `${key}${usage?.params ? `\t${usage.params}` : ''}:\t${usage?.purpose}`)
    .join('\n');

  return `${description}\n${usageLine}\n${commandListLine}\n${usage}`;
};

const getNotes = async (chatId: number): Promise<string> => {
  const notes = await getAllNotes(chatId);
  if (!notes?.length) {
    return 'Chưa có ghi chú nào!';
  }

  return printNotes(notes);
};

const addNote = async (chatId: number, madeBy: string, text: string)=> {
  const content = text.replace(commandMapping.add, '').trim();
  const note: Note = {
    content,
    madeBy
  };
  await addNewNote(chatId, note);
  return `ok, ${note.content}`;
};

const deleteNote = async (chatId: number, text: string) => {
  const index = Number(text.replace(commandMapping.delete, '')) - 1;
  await deleteNodeByIndex(chatId, index);
  return 'ok xong';
};


const getReplyMessage = async (msg: Message): Promise<string> => {
  const chatId = msg.chat.id;
  const text = msg.text.replace(BOT_COMMAND.NOTE, '').trim();
  const senderUsername = msg.from.username;

  if (!text || commandMapping.all.test(text)) {
    return getNotes(chatId);
  }

  if (commandMapping.help.test(text)) {
    return getHelp();
  }

  if (commandMapping.add.test(text)) {
    return addNote(chatId, senderUsername, text);
  }

  if (commandMapping.delete.test(text)) {
    return deleteNote(chatId, text);
  }

  return '';
};

const handleNoteRequest = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text.replace(BOT_COMMAND.NOTE, '').trim();
  const notes = await getAllNotes(chatId);
  bot.sendChatAction(chatId, 'typing');

  const newMsg: Message = {
    ...msg,
    text: getNotePrompt(text, notes)
  };
  handleChatMessage(bot, newMsg, 'pengy');
};


export const onNoteMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;

  const replyMessage = await getReplyMessage(msg);
  if (replyMessage) {
    await bot.sendMessage(chatId, replyMessage, { reply_to_message_id: msg.message_id });
    return;
  }

  handleNoteRequest(bot, msg);
};
