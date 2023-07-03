import { Command } from 'const/firebase/command';

export const fundUsage: {[key in Command]: {
    params?: string,
    purpose: string
} | null} = {
  [Command.all]: {
    purpose: 'list all funds'
  },
  [Command.update]: {
    params: '[name]:[balance]:[note?]',
    purpose: 'set fund'
  },
  [Command.get]: {
    params: '[name]',
    purpose: 'get fund balance by name'
  },
  [Command.log]: {
    params: '[name]',
    purpose: 'get funds logs by name'
  },
  [Command.help]: {
    purpose: 'show help'
  },
  [Command.set]: null,
  [Command.delete]: null
};