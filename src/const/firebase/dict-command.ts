export enum DictCommand {
    all = '\-all',
    add = '\-add',
    find = '\-find',
    delete = '\-delete',
    help = '\-help'
}

export const dictUsage: {[key in DictCommand]: {
    params?: string,
    usage: string
}} = {
    [DictCommand.all]: {
        usage: 'list all words'
    },
    [DictCommand.add]: {
        params: '[word]:[type]:[meaning]',
        usage: 'add new word'
    },
    [DictCommand.find]: {
        params: '[word]',
        usage: 'find a word'
    },
    [DictCommand.delete]: {
        usage: 'delete a word'
    },
    [DictCommand.help]: {
        usage: 'show help'
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