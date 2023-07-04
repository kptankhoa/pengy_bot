export enum Command {
    add = 'add',
    all = 'all',
    delete = 'delete',
    get = 'get',
    help = 'help',
    log = 'log',
    set = 'set',
    update = 'update'
}

export const getCommandRegEx = (command: Command) => {
  return new RegExp(`^${command}`);
};

export const commandMapping = {
  all: getCommandRegEx(Command.all),
  add: getCommandRegEx(Command.add),
  set: getCommandRegEx(Command.set),
  get: getCommandRegEx(Command.get),
  delete: getCommandRegEx(Command.delete),
  help: getCommandRegEx(Command.help),
  log: getCommandRegEx(Command.log),
  update: getCommandRegEx(Command.update),
};
