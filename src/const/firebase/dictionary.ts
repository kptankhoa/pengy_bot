import { Command } from 'const/firebase/command';

export const dictUsage: {[key in Command]: {
    params?: string,
    purpose: string
} | null} = {
  [Command.all]: {
    purpose: 'list all words'
  },
  [Command.set]: {
    params: '[word]:[type]:[meaning]:[synonym]',
    purpose: 'set a word'
  },
  [Command.get]: {
    params: '[word]',
    purpose: 'get words by name'
  },
  [Command.delete]: {
    params: '[word]',
    purpose: 'delete a word'
  },
  [Command.help]: {
    purpose: 'show help'
  },
  [Command.log]: null,
  [Command.add]: null,
  [Command.update]: null
};
