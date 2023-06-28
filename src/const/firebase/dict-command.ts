export enum DictCommand {
    all = '\-all',
    add = '\-add',
    find = '\-find',
    delete = '\-delete',
    help = '\-help'
}

export const dictUsage: {[key in DictCommand]: {
    params?: string,
    purpose: string
}} = {
    [DictCommand.all]: {
        purpose: 'list all words'
    },
    [DictCommand.add]: {
        params: '[word]:[type]:[meaning]:[synonym]',
        purpose: 'add new word'
    },
    [DictCommand.find]: {
        params: '[word]',
        purpose: 'find a word'
    },
    [DictCommand.delete]: {
        params: '[word]',
        purpose: 'delete a word'
    },
    [DictCommand.help]: {
        purpose: 'show help'
    },
}

export const getDictCommandRegEx = (command: DictCommand) => {
    return new RegExp(`^${command}`);
};

export const dictCommandMapping = {
    all: getDictCommandRegEx(DictCommand.all),
    add: getDictCommandRegEx(DictCommand.add),
    find: getDictCommandRegEx(DictCommand.find),
    delete: getDictCommandRegEx(DictCommand.delete),
    help: getDictCommandRegEx(DictCommand.help),
}