export enum Command {
    all = 'all',
    set = 'set',
    get = 'get',
    delete = 'delete',
    log = 'log',
    help = 'help',
    update = 'update'
}

export const getCommandRegEx = (command: Command) => {
  return new RegExp(`^${command}`);
};

export const commandMapping = {
  all: getCommandRegEx(Command.all),
  set: getCommandRegEx(Command.set),
  get: getCommandRegEx(Command.get),
  delete: getCommandRegEx(Command.delete),
  help: getCommandRegEx(Command.help),
  log: getCommandRegEx(Command.log),
  update: getCommandRegEx(Command.update),
};
