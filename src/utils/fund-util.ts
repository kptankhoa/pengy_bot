import { Fund, FundLog } from 'models';
import moment from 'moment';

const getNote = (note: Fund['note']) => note ? `\n\t\tGhi chú: ${note}` : '';

export const printFund = ({ name, balance, note }: Fund): string => `Quỹ: "${name}", Số dư: ${balance}.${getNote(note)}`;

export const printFunds = (funds: Fund[]) => funds.map((fund, index): string => `${index + 1}. ${printFund(fund)}`).join('\n');

export const printLog = ({ balance, note, updatedAt }: FundLog) => `${moment(updatedAt).utcOffset('+0700').format('DD/MM/yyyy HH:mm')}\nSố dư: ${balance}. Note: ${note || ''}`;

export const printFundLogs = (fundLogs: FundLog[]) => fundLogs.map((log, index): string => `${index + 1}. ${printLog(log)}`).join('\n');
