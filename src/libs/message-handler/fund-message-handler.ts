import { commandMapping, fundUsage } from 'const/firebase';
import { Fund, FundLog, Message } from 'models';
import { getAllFunds, getFundByName, getFundLogByName, updateFundByName } from 'services';
import { printFund, printFundLogs, printFunds } from 'utils/fund-util';
import { BOT_COMMAND } from 'const/chat';

const getDefaultMessage = () => 'No command recognized, use `/fund help` to show available commands.';

const getHelp = () => {
  const description = 'Pengy fund: fuck your ESOP';
  const usageLine = 'USAGE: `/fund [command] [options?]`';
  const commandListLine = 'Command list:';
  const usage = Object.entries(fundUsage)
    .filter(([, usage]) => !!usage)
    .map(([key, usage]) => `${key}${usage?.params ? `\t${usage.params}` : ''}:\t${usage?.purpose}`)
    .join('\n');

  return `${description}\n${usageLine}\n${commandListLine}\n${usage}`;
};

const getFunds = async (chatId: number): Promise<string> => {
  const funds: Fund[] = await getAllFunds(chatId);
  if (!funds.length) {
    return 'Chưa có quỹ nào';
  }
  return printFunds(funds);
};

const getFund = async (chatId: number, text: string): Promise<string> => {
  const fundName = text.replace(commandMapping.get, '').trim();
  const fund: Fund | null = await getFundByName(chatId, fundName);
  if (!fund) {
    return `Không có kết quả cho ${fund}`;
  }
  return printFund(fund);
};

const getFundLog = async (chatId: number, text: string): Promise<string> => {
  const fundName = text.replace(commandMapping.log, '').trim();
  const logs: FundLog[] = await getFundLogByName(chatId, fundName);
  if (!logs.length) {
    return `Chưa có lịch sử cho quỹ ${fundName}`;
  }
  return 'Lịch sử giao dịch gần nhất:\n' + printFundLogs(logs);
};

const updateFund = async (chatId: number, text: string): Promise<string> => {
  const updateFundStr = text.replace(commandMapping.update, '').trim();
  const [name, balance, note] = updateFundStr.split(':');
  const newFundLog: FundLog = {
    balance: balance?.trim() || '',
    note: note?.trim() || '',
    updatedAt: Date.now()
  };

  if (!note?.length) {
    delete newFundLog.note;
  }

  await updateFundByName(chatId, name, newFundLog);

  return `Đã cập nhật quỹ: ${name}`;
};

const getReplyMessage = async (chatId: number, text: string): Promise<string> => {
  if (!text || commandMapping.all.test(text)) {
    return getFunds(chatId);
  }

  if (commandMapping.help.test(text)) {
    return getHelp();
  }

  if (commandMapping.get.test(text)) {
    return getFund(chatId, text);
  }

  if (commandMapping.update.test(text)) {
    return updateFund(chatId, text);
  }

  if (commandMapping.log.test(text)) {
    return getFundLog(chatId, text);
  }
  return getDefaultMessage();
};

export const onFundMessage = async (bot: any, msg: Message) => {
  const chatId = msg.chat.id;
  const chatText = msg.text.replace(BOT_COMMAND.FUND, '').trim();

  const replyMessage = await getReplyMessage(chatId, chatText);
  await bot.sendMessage(chatId, replyMessage, { reply_to_message_id: msg.message_id });
};
