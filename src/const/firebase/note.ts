import { Command } from 'const/firebase/command';

export const noteUsage: {[key in Command]: {
    params?: string,
    purpose: string
} | null} = {
    [Command.all]: {
        purpose: 'list all notes'
    },
    [Command.add]: {
        params: '[note]',
        purpose: 'add a new note'
    },
    [Command.delete]: {
        params: '[index]',
        purpose: 'delete a note'
    },
    [Command.help]: {
        purpose: 'show help'
    },
    [Command.log]: null,
    [Command.get]: null,
    [Command.set]: null,
    [Command.update]: null
};
