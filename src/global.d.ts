type Command = {
  name: string;
  description: string;
  execute: (args: string[], output: NodeJS.WriteStream, commandHandler: CommandHandler) => void;
};

type CommandHandler = {
  getCommands: () => Command[];
  execute: (commandName: string, args: string[], output: NodeJS.WriteStream) => void;
};
